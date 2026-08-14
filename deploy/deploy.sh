#!/usr/bin/env bash
#
# =====================================================================
# deploy.sh —— 服务器部署/回滚脚本（新手向注释）
#
# 这个脚本跑在"服务器"上，负责把某个环境的容器拉起来并更新到新版本。
# 平时不是人手动执行，而是 GitHub Actions（ci.yml）通过 SSH 远程调用，
# 但你想手动部署/回滚时也可以直接在服务器上执行。
#
# 用法:
#   bash deploy/deploy.sh <staging|prod> <image-sha> [--no-migrate]
#   例:  bash deploy/deploy.sh staging a1b2c3d4e5f6
#        bash deploy/deploy.sh prod a1b2c3d4e5f6 --no-migrate
#
# 它做的事（从上到下）:
#   1. 检查参数（环境名 + 镜像标签 sha）
#   2. 进入服务器上的仓库目录（默认 /srv/devflow）
#   3. 用"项目名 devflow-<环境>" + 对应 .env.<环境> + 对应覆盖文件，拼出 compose 命令
#   4. 从 ACR 拉取 web/api 两个新镜像
#   5. docker compose up 启动整套服务（--no-build 表示绝不现场构建）
#   6. 循环检查 api 健康接口 + web 首页，最多等 3 分钟
#   7. 执行数据库迁移 prisma migrate deploy
#   8. 全部成功就把这次 sha 记到 .last-<环境>；任一步失败自动回滚到上一个 sha
# =====================================================================

# set -euo pipefail 是 bash 的"安全开关"：
#   -e       任何一条命令失败就立刻退出（不继续往下跑）
#   -u       用到没定义的变量直接报错
#   -o pipefail  管道中任何一步失败都算失败
# 这样脚本出问题时不会"带病继续"，更容易发现错误。
set -euo pipefail

# ---------------------------- 读取参数 ----------------------------
# "${1:-}" 表示取第 1 个参数，没传就是空字符串（不会因未定义而报错）
ENV_NAME="${1:-}"   # 环境名：staging 或 prod
SHA="${2:-}"        # 镜像标签里的 sha（Git 提交号前 12 位），决定拉哪个镜像

MIGRATE=1                                   # 默认要跑数据库迁移（1 = 是）
if [ "${3:-}" = "--no-migrate" ]; then      # 如果第 3 个参数是 --no-migrate
  MIGRATE=0                                 # 就跳过迁移（0 = 否）
fi

# 参数校验：环境名或 sha 为空时打印用法并退出（exit 2 表示"参数错误"）
if [ -z "$ENV_NAME" ] || [ -z "$SHA" ]; then
  echo "Usage: deploy.sh <staging|prod> <image-sha> [--no-migrate]" >&2
  exit 2
fi
# 环境名只允许 staging 或 prod，防止手滑拼错
case "$ENV_NAME" in
  staging|prod) ;;
  *) echo "Unknown env: $ENV_NAME (expected staging or prod)" >&2; exit 2 ;;
esac

# ---------------------------- 准备工作目录 ----------------------------
# 仓库在服务器上的位置。${REPO_DIR:-/srv/devflow} 表示：
# 如果设置了环境变量 REPO_DIR 就用它，否则用默认值 /srv/devflow。
REPO_DIR="${REPO_DIR:-/srv/devflow}"
cd "$REPO_DIR"   # 进入仓库目录，后面所有相对路径都基于这里

# 根据环境名拼出对应的文件名：
#   staging -> .env.staging / docker-compose.staging.yml / devflow-staging / .last-staging
#   prod    -> .env.prod    / docker-compose.prod.yml    / devflow-prod    / .last-prod
ENV_FILE=".env.${ENV_NAME}"                    # 这个环境的密钥/配置（不在 git 里）
COMPOSE_FILE="docker-compose.${ENV_NAME}.yml"  # 这个环境的 compose 覆盖文件（在 git 里）
PROJECT="devflow-${ENV_NAME}"                  # Compose 项目名，用来隔离两套环境
LAST_FILE=".last-${ENV_NAME}"                  # 记录上次成功部署的 sha，用于回滚

# 检查 .env.<环境> 是否存在（它存了数据库密码等密钥，只在服务器上手工创建）
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing ${REPO_DIR}/${ENV_FILE} (create it from ${ENV_FILE}.example)" >&2
  exit 2
fi

# ---------------------------- 拼 compose 命令 ----------------------------
# 这里定义了一个 bash "数组"，里面是一整条 docker compose 命令的参数：
#   -p devflow-<环境>        指定项目名（容器/网络/卷都带这个前缀，实现两套环境隔离）
#   --env-file .env.<环境>   指定读哪个 .env 文件（变量插值的数据来源）
#   -f docker-compose.yml    主文件（定义所有服务）
#   -f docker-compose.<环境>.yml  环境覆盖文件（只改 api/web 的镜像和环境变量）
# 之后用 "${COMPOSE[@]}" 展开执行，例如 "${COMPOSE[@]}" pull web api
COMPOSE=(docker compose -p "$PROJECT" --env-file "$ENV_FILE" -f docker-compose.yml -f "$COMPOSE_FILE")

# ---------------------------- 函数：回滚 ----------------------------
# 部署任一步失败时调用：把容器换回"上一次成功部署的 sha"对应的镜像。
rollback() {
  local PREV
  # 读上次成功的 sha；文件不存在就当作空（2>/dev/null 屏蔽报错，|| true 防止 set -e 退出）
  PREV="$(cat "$LAST_FILE" 2>/dev/null || true)"
  echo "==> [$PROJECT] deploy failed @ $SHA"
  if [ -n "$PREV" ] && [ "$PREV" != "$SHA" ]; then
    echo "==> [$PROJECT] rolling back to previous image sha: $PREV"
    # 用"旧 sha"重新拉镜像并重启 web/api。
    # 注意 DEVFLOW_SHA=xxx 写在命令前面 = 只对这条命令临时设置环境变量，
    # compose 里 ${DEVFLOW_SHA} 会插值成旧 sha，所以拉的就是旧镜像。
    DEVFLOW_SHA="$PREV" "${COMPOSE[@]}" pull web api
    DEVFLOW_SHA="$PREV" "${COMPOSE[@]}" up -d --no-build web api
  else
    echo "==> [$PROJECT] no previous sha recorded; leaving current state for manual inspection"
  fi
}

# ---------------------------- 函数：等待健康 ----------------------------
# 部署后容器虽然启动了，但程序可能还没就绪（数据库连接、启动流程等）。
# 这里循环执行容器内的健康检查：api 请求 /api/v1/health，web 请求首页，
# 两条都成功才算健康；最多试 36 次，每次等 5 秒（合计最多 3 分钟）。
wait_healthy() {
  local tries=36  # 36 * 5s = 最多等待 3 分钟
  for _ in $(seq 1 "$tries"); do
    if "${COMPOSE[@]}" exec -T api node -e "fetch('http://localhost:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
      && "${COMPOSE[@]}" exec -T web node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
      return 0
    fi
    sleep 5
  done
  return 1
}

# ---------------------------- 正式部署流程 ----------------------------
# export 把 sha 变成环境变量传给 docker compose，覆盖文件里
# ${DEVFLOW_SHA} 就会插值成这次部署的 sha，从而拼出正确的镜像标签。
export DEVFLOW_SHA="$SHA"

echo "==> [$PROJECT] pulling images @ $SHA"
# 只拉 web 和 api 两个镜像（postgres/redis 等用官方镜像，不用每次拉）
"${COMPOSE[@]}" pull web api

echo "==> [$PROJECT] starting stack (no-build)"
# up -d = 后台启动；--no-build = 绝不现场构建，只使用拉下来的镜像。
# 第一次部署会顺带创建 postgres/redis/nginx 等全部服务，之后只更新有变化的。
# 失败就回滚并退出。
if ! "${COMPOSE[@]}" up -d --no-build; then
  rollback
  exit 1
fi

echo "==> [$PROJECT] waiting for api/web health checks"
# 等容器真正"健康"（程序能响应请求）才继续，避免迁移跑在还没就绪的库上
if ! wait_healthy; then
  rollback
  exit 1
fi

if [ "$MIGRATE" = "1" ]; then
  echo "==> [$PROJECT] running prisma migrations"
  # 数据库结构变更（新增表/字段）通过迁移脚本应用到数据库。
  # exec -T 表示进入 api 容器里执行命令（-T 是给 CI 用的，不分配终端）。
  # migrate deploy 只应用"还没应用过"的迁移，重复执行是安全的。
  if ! "${COMPOSE[@]}" exec -T api npx prisma migrate deploy; then
    rollback
    exit 1
  fi
else
  echo "==> [$PROJECT] skipping migrations (--no-migrate)"
fi

# 全部成功：把这次 sha 记下来，下次失败时就能回滚到这个版本
echo "$SHA" > "$LAST_FILE"
echo "==> [$PROJECT] deployed @ $SHA (migrate=$MIGRATE)"
