# 阿里云部署手册

> 目标架构：一台 ECS（Docker Compose）承载 web / api / postgres / redis / meilisearch / nginx，前面挂阿里云 CDN；图片走 OSS + CDN。

## 1. 域名与备案（并行，先启动）

1. 在阿里云「域名注册」购买域名（如 `devflow.dev`）；
2. 在「ICP 备案」控制台提交备案申请（个人备案约 1–3 周）；
3. **备案完成前**：域名不得解析到大陆服务器公网访问，可用 `http://服务器IP:8080` 临时验收；
4. 备案通过后：域名解析记录（A 记录指向 ECS IP，或 CNAME 到 CDN 加速域名）。

## 2. 服务器（ECS）

- 规格：2C4G 起步，系统盘 40–60GB，带宽按量 5Mbps 起；
- 系统：Ubuntu 22.04 / Alibaba Cloud Linux 3；
- 安全组放行：22（SSH）、80、443；
- 安装 Docker：

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 3. 部署应用

```bash
git clone <your-repo> /srv/devflow && cd /srv/devflow
cp .env.example .env
vi .env   # 填写 POSTGRES_PASSWORD / JWT_ACCESS_SECRET / CORS_ORIGINS / NUXT_PUBLIC_SITE_URL 等

docker compose up -d --build
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

访问 `http://IP` 验证：首页 SSR 可打开、`/api/v1/health` 返回 ok、Swagger `/api/v1/docs` 可访问。

## 4. HTTPS

```bash
# 域名解析到 ECS 后，为站点申请证书
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d www.example.com -d example.com
```

签发成功后，打开 `deploy/nginx.conf` 中的 443 server 块（填写域名与证书路径）并 `docker compose restart nginx`。

## 5. OSS + CDN（图片加速）

1. 开通 OSS，创建 Bucket（如 `devflow-assets`，私有读写）；
2. 创建 RAM 子账号，授权该 Bucket 的 `PutObject`，拿到 AccessKey；
3. 在 `.env` 填入 `OSS_*`，`OSS_PUBLIC_URL` 指向 CDN 加速域名（如 `https://cdn.example.com`）；
4. 阿里云 CDN：添加加速域名 `cdn.example.com` → 源站类型「OSS 域名」；
5. CDN 缓存规则：`*.jpg/*.png/*.webp` 缓存 30 天，`/uploads/*` 缓存 7 天；
6. 代码层（`apps/api/src/uploads`）检测到 OSS 配置后自动切换为 OSS 上传，无需改动前端。

## 6. 主站 CDN（HTML 与静态资源加速）

- 给 `www.example.com` 添加 CDN 加速域名，源站为 ECS IP（80/443）；
- 缓存规则：`/_nuxt/*` 缓存 30 天（不可变）；`/`、`/article/*` 缓存 60 秒（SWR 语义，回源 Nuxt 已有 SWR 缓存）；其余不缓存（动态请求）；
- 海外用户可开启 CDN 海外节点，实现全球加速。

## 7. 更新与维护

```bash
cd /srv/devflow
git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy   # 如有 schema 变更
docker compose logs -f --tail=100 api web           # 查看日志
```

## 8. 常见问题

- **备案前无法访问**：用 ECS 公网 IP 访问，`CORS_ORIGINS` 先填 `http://IP`；
- **中文搜索不准**：确认 Meilisearch 容器健康，`MEILI_HOST` 指向 `http://meilisearch:7700`；
- **上传 500**：确认 `UPLOAD_DIR` 目录可写（`uploaddata` 卷已挂载）；若配置了 OSS，检查 AccessKey 权限；
- **首页缓存不刷新**：SWR 60 秒 + CDN 60 秒是预期行为；文章发布后最长 ~2 分钟全网可见；
- **本机 Node 版本**：nvm-windows 用户在管理员终端 `nvm use 22.14.0`；或直接使用 `D:\node22`（将 `D:\node22` 放到 PATH 最前）。
