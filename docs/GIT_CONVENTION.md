# Git 提交信息规范

本项目使用 `husky` + `lint-staged` + `commitlint` 统一代码风格和 Git 提交信息。提交时 `commit-msg` 钩子会自动校验格式，不符合规范会被拦截。

## 提交信息格式

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 约定：

```
<type>(<scope>): <subject>
```

- `type`：必填，改动类型，取值见下表。
- `scope`：可选，影响范围，例如 `web`、`api`、`shared`。
- `subject`：必填，一句话说明改动，首字母小写，末尾不加句号，不超过 72 字符。
- `body`：可选，正文说明“为什么”，每行不超过 100 字符。
- `footer`：可选，用于标注破坏性变更，格式为 `BREAKING CHANGE: <说明>`。

## type 类型说明

| type       | 含义                         | 示例                              |
| ---------- | ---------------------------- | --------------------------------- |
| `feat`     | 新增功能                     | `feat: 新增首页文章流`            |
| `fix`      | 修复缺陷                     | `fix(api): 修复刷新令牌过期问题`  |
| `docs`     | 文档变更                     | `docs: 更新部署文档`              |
| `style`    | 代码格式改动（不影响功能）   | `style: 调整组件缩进`             |
| `refactor` | 重构（不新增功能、不修缺陷） | `refactor(api): 抽取公共鉴权逻辑` |
| `perf`     | 性能优化                     | `perf: 缓存文章列表请求`          |
| `test`     | 测试相关                     | `test: 补充登录接口用例`          |
| `build`    | 构建系统或外部依赖           | `build: 升级 pnpm 至 11.x`        |
| `ci`       | CI 配置变更                  | `ci: 新增部署校验步骤`            |
| `chore`    | 其他杂项                     | `chore: 更新 .gitignore`          |
| `revert`   | 回滚到某次提交               | `revert: 撤销上一版改动`          |

## 完整示例

```
feat(web): 新增首页文章流
```

带正文和破坏性变更：

```
feat(api): 重构认证接口

登录接口改为返回 refreshToken，兼容旧客户端。

BREAKING CHANGE: 登录接口不再返回 accessToken
```

## 正确与错误对比

| 正确                     | 错误                     | 原因                    |
| ------------------------ | ------------------------ | ----------------------- |
| `fix: 修复登录问题`      | `fix修复登录问题`        | type 后必须有冒号和空格 |
| `feat(web): 新增文章页`  | `feat(web)新增文章页`    | 缺少冒号                |
| `docs: 更新部署文档`     | `DOCS: 更新部署文档`     | type 应小写             |
| `chore: 更新 .gitignore` | `chore`                  | 缺少 subject            |
| `feat: 新增首页文章流`   | `feat: 新增首页文章流。` | subject 末尾不加句号    |

## 提交前自动格式化

`.husky/pre-commit` 会执行 `lint-staged`：

- 对暂存的 `*.{js,ts,vue}` 先 `prettier --write`，再 `eslint --max-warnings=0`（严格校验）。
- 对 `*.{json,md,yml,yaml}` 执行 `prettier --write`。
- 锁文件 `pnpm-lock.yaml` 已加入 `.prettierignore`，不会被格式化。

## 使用说明

- 首次克隆项目后运行 `pnpm install`，会自动执行 `husky` 配置 Git hooks。
- 提交时按上述格式编写 message，否则会被 `commit-msg` 钩子拦截。
- 本项目为 pnpm workspace，请使用 `pnpm` 而非 `npm` / `yarn`。

## 调试

- 跳过 Git hooks：`git commit --no-verify`
- 手动检查提交信息：`echo "feat: xxx" | pnpm exec commitlint`
- 全量 ESLint 检查：`pnpm lint:eslint`
