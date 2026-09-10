# DevShare（技享）· 项目经历（面试版）

> 面向开发者技术分享社区的全栈项目，从 0 到 1 完成产品设计、前后端开发、性能优化、测试与上线部署。
> 本文档用于面试自述与简历素材。**标注 `【替换】` 的地方请填入你项目里的真实数据**（QPS、Lighthouse 分数、构建体积等以你自己实测为准）。

---

## 0. 一句话概述（简历用，约 120 字）

> 独立设计并实现类掘金技术社区 **DevShare**：基于 **pnpm monorepo**，前端 **Nuxt 4 SSR + Vue 3 + TS**，后端 **NestJS 11 + Prisma + PostgreSQL**，引入 **Redis** 做缓存/计数/刷新令牌、**Meilisearch** 做全文检索。完成 SSR 首屏、虚拟滚动长列表、游标分页、热点榜单算法、JWT 双令牌鉴权等核心能力，Docker 多阶段构建 + GitHub Actions CI/CD 分级发布至阿里云（ECS + OSS + CDN），并通过 AI 编程工具将开发效率显著提升。

---

## 1. 项目背景与目标

**背景**：面向开发者的技术内容社区，核心价值是「高质量技术内容的生产、发现与讨论」。原项目（`myjuejin`）功能零散、无工程规范，我主导了从架构重构到上线部署的全过程。

**目标**：

- 从 0 到 1 交付可上线的最小完整产品（文章 + 互动 + 搜索 + 榜单 + i18n）；
- 首页与文章详情做 **SSR**，兼顾首屏速度与 SEO；
- 长列表（信息流/评论）做 **虚拟滚动**，千级数据滚动保持流畅；
- 中英双语，国内云部署 + CDN 加速；
- 建立可持续迭代的工程规范（monorepo、类型共享、CI/CD、提交规范）。

**我的角色**：全栈开发 + 架构设计 + 部署运维（个人项目，全流程独立完成）。

---

## 2. 技术栈

| 层次     | 选型                                                                         | 说明                             |
| -------- | ---------------------------------------------------------------------------- | -------------------------------- |
| 前端     | Nuxt 4（Vue 3 + Vite + TS）、Tailwind CSS v4                                 | SSR/SPA 混合渲染                 |
| 前端能力 | TanStack Query / TanStack Virtual、Pinia、vue-i18n、cropperjs                | 状态、虚拟滚动、国际化、图片裁剪 |
| 后端     | NestJS 11、Prisma ORM                                                        | 模块化 + 类型安全 ORM            |
| 数据     | PostgreSQL 16、Redis 7、Meilisearch                                          | 主库 / 缓存计数 / 全文检索       |
| 工程     | pnpm workspace、ESLint 9、Prettier、Husky + lint-staged + commitlint         | 规范化协作                       |
| 测试     | Jest（API）、Vitest（Web）、Supertest（E2E）                                 | 单测 + 关键路径                  |
| 运维     | Docker Compose、Nginx、GitHub Actions、阿里云 ACR/ECS/OSS/CDN、Let's Encrypt | 自动化发布                       |

---

## 3. 系统架构

```
                    ┌────────────────────────────┐
   浏览器 / CDN ───▶ │ Nginx（gzip / 长缓存 / 错误页） │
                    └──────────────┬─────────────┘
                        /_nuxt/*   │  /api/*      /uploads/*
                    ┌──────────────▼─────┐  ┌──────▼────────────────┐
                    │ Nuxt 4 SSR (Nitro) │  │ NestJS API (/api/v1)  │
                    │ SSR + SWR 路由缓存  │  │ 鉴权/限流/校验/统一响应 │
                    └────────────────────┘  └──┬────┬────┬──────────┘
                                               │    │    │
                                    ┌──────────▼┐ ┌─▼──┐ ┌▼─────────┐
                                    │PostgreSQL │ │Redis│ │Meilisearch│
                                    └───────────┘ └────┘ └──────────┘
```

**目录结构**

```
apps/
  web/    # Nuxt 4 前端（SSR 首页 + 文章详情，重交互页 SPA）
  api/    # NestJS 后端（/api/v1）
packages/
  shared/ # 前后端共享 TS 类型与常量（单一事实来源）
deploy/   # Nginx 配置、部署脚本、双语错误页
docs/     # PRD、设计规范、部署手册、Nuxt 学习指南
```

---

## 4. 核心技术亮点

> 面试建议按「问题 → 方案 → 结果」讲，以下是可直接展开的亮点。

### 4.1 SSR / SPA 混合渲染与路由级缓存策略

**问题**：全部 SSR 会让重交互页（编辑器、设置、搜索）承担不必要的服务端渲染开销；全部 CSR 又拿不到首屏速度和 SEO。

**方案**：在 [nuxt.config.ts](apps/web/nuxt.config.ts) 用 `routeRules` 按页面特征分级：

- `/article/**`、`/en/**` → `swr: 60`（SSR + 60s 陈旧重验证，兼顾 SEO 与并发）；
- `/` → SSR 实时（信息流需最新）；
- `/write`、`/settings`、`/search`、`/tag/**`、`/login` → `ssr: false`（纯 SPA，省服务端开销）。

**结果**：首屏 HTML 直出、SEO 友好，同时把服务端渲染成本集中到真正需要的页面上。

---

### 4.2 彻底解决 SSR 水合（Hydration）不一致问题 ⭐

**问题**：SSR 页面出现 hydration mismatch 警告、页面闪烁：

1. `viewCount` 等动态字段在 SSR 与客户端二次请求时不一致；
2. 相对时间（"3 分钟前"）服务端与客户端 `Date.now()` 不同；
3. 依赖 `localStorage` 的登录态，服务端（未登录）与客户端首帧（已登录）渲染不一致；
4. 虚拟滚动在服务端拿不到真实滚动容器尺寸，首屏就虚拟滚动必然不一致。

**方案（4 个针对性修复）**：

1. **关闭 payload 提取**：`experimental.payloadExtraction: false`，把 `useAsyncData` 数据内联进 HTML，客户端激活后复用同一份数据，不再重复请求 → 从源头消除数据不一致（见 [nuxt.config.ts](apps/web/nuxt.config.ts)）；
2. **时间基准同构**：新增 [useNow.ts](apps/web/composables/useNow.ts)，SSR 生成一次 `now` 并通过 Nuxt payload 同步客户端，两端首次渲染用同一时间，挂载后每 60s 刷新；
3. **客户端状态延迟渲染**：新增 [useHydrated.ts](apps/web/composables/useHydrated.ts)，登录态等「仅客户端可知」的状态在挂载后再渲染；
4. **虚拟列表分级渲染**：见 [VirtualFeed.vue](apps/web/components/VirtualFeed.vue)，SSR 阶段静态渲染前 12 条（利于 SEO），`onMounted` 后才切换为真正的虚拟滚动。

**结果**：水合警告清零、首屏无闪烁，且 SEO 与滚动性能兼得。这是我排查最久、也最能体现 SSR 同构理解的难点，面试可作深度案例。

---

### 4.3 长列表虚拟滚动 + 无限加载

**问题**：信息流数据量上千条，全量 DOM 渲染导致滚动卡顿、内存上涨。

**方案**（[VirtualFeed.vue](apps/web/components/VirtualFeed.vue)）：

- 基于 `@tanstack/vue-virtual`，只渲染可视窗口 + `overscan: 8` 的条目；
- 用 `translateY(start)` 绝对定位替代文档流，行高固定 160 + 12 间距；
- **滚动触底预加载**：监听可视区最后一个 index，距列表末尾不足 5 条时触发 `loadMore()`，提前拉下一页；
- 数据由 [pages/index.vue](apps/web/pages/index.vue) 注入：首屏来自 SSR 内联数据，切换 tab / 触底才发起新请求。

**结果**：DOM 节点数从 **上千 → 约 20**【替换为你实测】，滚动帧率稳定、内存可控。

---

### 4.4 游标分页（Keyset Pagination）替代 OFFSET

**问题**：社区信息流持续追加，`LIMIT/OFFSET` 深翻页有性能衰减，且新内容插入会导致「重复/漏读」。

**方案**（[articles.service.ts](apps/api/src/articles/articles.service.ts)）：

- 采用 **keyset（游标）分页**，一次多取 1 条判断 `hasMore`；
- 排序不同、游标结构不同：
  - 最新：`{ p: publishedAt, id }` → `WHERE publishedAt < p OR (publishedAt = p AND id < id)`
  - 热门：`{ s: hotScore, id }` → `WHERE hotScore < s OR (hotScore = s AND id < id)`
- 游标用 `base64url` 编码，避免暴露内部字段；
- 配合 Prisma 复合索引 `@@index([status, publishedAt])`、`@@index([status, hotScore])`，走索引扫描。

**结果**：翻页复杂度不随页码增长，数据无重复无遗漏；`limit` 做 `min(50)` 上限保护。

---

### 4.5 热点榜单：时间衰减算法 + Redis 缓存 + 定时重算 🔥

**问题**：热门榜不能简单按阅读量排（老文长期霸榜）；也不能每次请求都全表计算。

**方案**（[rank.service.ts](apps/api/src/rank/rank.service.ts)）：

- **类 Hacker News 热度算法**，互动行为加不同权重、按时间做幂次衰减：
  ```
  base = log(view+1)*1 + log(like+1)*8 + log(collect+1)*10 + log(comment+1)*12
  hotScore = base / (ageHours + 2)^1.5
  ```
  收藏/评论权重最高（质量信号），阅读量权重最低（易刷）；`(age+2)^1.5` 让新内容有曝光机会、老内容快速衰减；
- **node-cron 每小时全量重算** `hotScore` 并写回 DB；
- 榜单结果缓存到 Redis（key `rank:hot:v1`，TTL 600s），重算后主动失效。

**结果**：榜单请求从「全表排序」变为「读 Redis 缓存 + 按 id 批量取详情」，响应稳定在毫秒级。

---

### 4.6 浏览量计数：Redis 增量 + 定时落库（Write-Back）

**问题**：每次访问都 `UPDATE viewCount = viewCount + 1`，高并发会打爆数据库写。

**方案**（[articles.service.ts](apps/api/src/articles/articles.service.ts) + [rank.service.ts](apps/api/src/rank/rank.service.ts)）：

- 访问时只做 `INCR views:{id}`（Redis 内存计数，无 DB 写）；
- 列表展示时用 `MGET` 批量取增量，与 DB 的 `viewCount` 相加返回，用户看到实时值；
- 每小时榜单重算时把 Redis 增量**批量落库并清零**（write-back）。

**结果**：高频写从「每次 PV 一次 UPDATE」降为「每小时一次批量 UPDATE」，DB 写压力大幅下降，展示仍实时。

---

### 4.7 全文检索：Meilisearch + PostgreSQL 兜底降级

**问题**：`LIKE '%keyword%'` 无法满足中文/多词/排序需求；但搜索服务故障就整个搜索不可用也不合理。

**方案**（[search.service.ts](apps/api/src/search/search.service.ts)）：

- **主链路**：Meilisearch，启动时配置 `searchableAttributes / filterableAttributes / sortableAttributes`，并做 **reindexAll 存量回填**（解决 seed 历史数据搜不到的问题）；发布/更新/删除文章时同步索引；
- **降级兜底**：`MEILI_HOST` 未配置或检索异常时自动回退 PostgreSQL——把关键词按空白拆词，构造「每个词都要在 标题/摘要/作者/标签 任一字段命中」的 `AND of OR` 查询，用 `mode: 'insensitive'` 兼容大小写；
- 搜索结果拿到 id 列表后复用统一的 `getByIds`，保持返回结构一致。

**结果**：搜索可用性不依赖单一中间件，异常时无缝降级。

---

### 4.8 安全体系：JWT 双令牌轮换 + 多层防护

**方案**（[auth.service.ts](apps/api/src/auth/auth.service.ts)、[main.ts](apps/api/src/main.ts)）：

- **Access Token**：JWT，有效期 30min；
- **Refresh Token**：48 字节随机串，仅存 Redis（`refresh:{token}`，7 天 TTL），放 **httpOnly Cookie**；刷新时**轮换**（旧 token 立即删除），降低泄露风险；
- **前端无感刷新**：见 [useApi.ts](apps/web/composables/useApi.ts)，返回 `UNAUTHORIZED` 且本地有 token 时自动调 `/auth/refresh` 并**重试原请求**；
- **Markdown 防 XSS**：`markdown-it` 关闭原始 HTML（`html: false`）+ `xss` 白名单净化，见 [markdown.util.ts](apps/api/src/articles/markdown.util.ts)；
- **其他**：`helmet` 安全头、`@nestjs/throttler` 全局限流 120 req/min、CORS 白名单、上传类型/大小校验、bcrypt 密码哈希。

---

### 4.9 图片上传：OSS 签名直传 + 本地降级

**方案**（[uploads.service.ts](apps/api/src/uploads/uploads.service.ts)）：

- 未配置 OSS 时写本地磁盘（按 `年/月` 分目录 + UUID 文件名，避免重名与单目录文件过多）；
- 配置 OSS 时用 **HMAC-SHA1 手写签名**构造 PUT 请求直传阿里云 OSS，返回 CDN 公网地址，不引入重型 SDK；
- 前端配合 [ImageCropperDialog.vue](apps/web/components/ImageCropperDialog.vue)（cropperjs）在上传前裁剪压缩，减少带宽与存储。

---

### 4.10 工程化地基：Monorepo + 共享类型 + 统一契约

- **pnpm workspace** 管理 `web / api / shared`，`@devshare/shared` 作为前后端**唯一类型来源**，DTO/分页/错误码统一，避免接口字段漂移；
- 后端统一契约：全局前缀 `api/v1`、`ValidationPipe`（whitelist + transform）、`TransformInterceptor` 统一包 `{ data }`、`HttpExceptionFilter` 统一错误结构 + 业务错误码（见 [main.ts](apps/api/src/main.ts)、[transform.interceptor.ts](apps/api/src/common/interceptors/transform.interceptor.ts)、[http-exception.filter.ts](apps/api/src/common/filters/http-exception.filter.ts)），前端按 `code` 做 i18n 错误提示；
- **Swagger** 自动文档挂载 `/api/docs`；
- **提交规范**：Husky + lint-staged + commitlint（Conventional Commits），提交前自动 Prettier + ESLint 校验（见 [GIT_CONVENTION.md](docs/GIT_CONVENTION.md)）。

---

## 5. 性能优化专章（面试重点）

| #   | 优化点   | 手段                                                                                                      | 效果                            |
| --- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | 首屏渲染 | 首页/文章详情 SSR + `swr: 60` 路由缓存                                                                    | TTFB 【替换】ms，SEO 可直接抓取 |
| 2   | 长列表   | TanStack Virtual 虚拟滚动 + 触底预加载                                                                    | DOM 节点 上千 → ~20，滚动流畅   |
| 3   | 分页     | Keyset 游标分页 + 复合索引                                                                                | 深翻页不衰减，无重复/漏读       |
| 4   | 写压力   | 浏览量 Redis 增量 + 定时批量落库                                                                          | DB 写从「每 PV」降到「每小时」  |
| 5   | 热点计算 | 热度离线重算 + Redis 缓存 10min                                                                           | 榜单接口毫秒级                  |
| 6   | 重复请求 | `payloadExtraction: false` 复用 SSR 内联数据                                                              | 首屏激活后不再重复请求          |
| 7   | 网络传输 | Nginx gzip + `/_nuxt/*` 30 天 immutable 强缓存 + CDN                                                      | 静态资源命中率 【替换】%        |
| 8   | 图片资源 | 无封面用「种子值渐变」代替装饰图（[visual.ts](apps/web/utils/visual.ts)）+ 上传前裁剪 + 懒加载            | 减少图片请求与体积              |
| 9   | 查询效率 | Prisma 复合索引（`[status,publishedAt]`、`[status,hotScore]`、`[articleId,createdAt]`、唯一键防重复点赞） | 热点查询走索引                  |
| 10  | 请求竞态 | 信息流 `requestSeq` 序号丢弃过期响应                                                                      | 快速切 tab 不会串数据           |

**可量化指标（建议面试前实测并填入）**：

- Lighthouse 移动端 Performance / SEO / Best Practices：【替换】
- 首屏 JS（gzip）：【替换】KB
- 首页 SSR TTFB（命中缓存）：【替换】ms
- 信息流 1000 条滚动：帧率 【替换】fps

---

## 6. AI 辅助开发经验 ⭐（面试差异化亮点）

> 当前面试高频加分项。核心不是「我会用 AI 写代码」，而是**"我把 AI 用成了一条可控的研发流水线"**。

### 6.1 工具链

- **Claude Code**（主力，终端内的 Agent 式编程）：跨文件重构、问题定位、生成配置与文档；
- **GitHub Copilot / Cursor**：行内补全、样板代码；
- 配置项目级权限与工作目录（[.claude/settings.local.json](.claude/settings.local.json)），让 AI 在受控范围内直接执行 `pnpm lint / build / dev` 等命令并**自验证**。

### 6.2 落地场景（按价值排序）

1. **复杂 Bug 定位与修复（最高价值）**
   - 典型：SSR **水合不一致**。我把 `nuxt.config.ts`、相关组件、报错一并交给 AI，让它给出**多个可疑来源的假设**，我逐一验证，最终定位到「payload 重复请求 / 时间基准不同 / localStorage 登录态 / 虚拟列表服务端无尺寸」四类根因，并分别设计修复（见 4.2）。AI 在这里的价值是**穷举假设 + 提供对照方案**，判断和验证仍由我负责。
   - 典型：Docker 里 Prisma 报 `@prisma/client did not initialize yet`。AI 帮我分析出 `pnpm deploy --prod` 不会带出 `.prisma/client`（含 query engine），从而定位到拷贝缺失，见 [apps/api/Dockerfile](apps/api/Dockerfile)。

2. **工程化配置生成**
   - GitHub Actions CI/CD、Docker 多阶段构建、Nginx 配置、ESLint/Prettier/Husky 等：我先描述需求与约束，AI 生成初稿，我逐条 review 并按项目实际调整（如 ACR 镜像搬运绕过 Docker Hub 拉取失败、SWR 缓存策略）。

3. **文档与知识沉淀**
   - 生成带「新手向注释」的部署/CI/Dockerfile 说明和 [NUXT_GUIDE.md](docs/NUXT_GUIDE.md)（Nuxt 学习指南），把项目变成可自学、可交接的文档资产。

4. **测试与重构**
   - 让 AI 基于 service 方法生成 Jest 用例骨架（[articles.service.spec.ts](apps/api/src/articles/articles.service.spec.ts)、[auth.service.spec.ts](apps/api/src/auth/auth.service.spec.ts)、[tags.service.spec.ts](apps/api/src/tags/tags.service.spec.ts)），我再补边界用例；对长函数让 AI 提重构建议。

5. **代码审查**
   - 提交前让 AI 以「严格 reviewer」角色审查 diff，检查空指针、并发、安全（XSS/越权）、i18n 漏翻等，作为人工 review 的补充。

### 6.3 我总结的方法论（这段最能打动面试官）

- **上下文 > 提示词**：给 AI 足够的代码、报错、约束和「为什么」，胜过堆砌话术；
- **小步快跑**：一次只让 AI 改一个可验证的点，配合 `pnpm lint / test / build` 做**自动化护栏**，避免大范围不可控改动；
- **AI 产出必须人工 review**：AI 会「自信地编造」API 用法与依赖，尤其在安全、并发、SQL 上要重点复核；
- **安全红线**：绝不把密钥、生产环境变量、用户数据交给外部 AI；
- **把 AI 沉淀成资产**：不只让 AI 写代码，还让它同步产出注释、文档、测试，让团队持续受益。

### 6.4 效率收益（示例，请按实际调整）

- 脚手架 + 工程化配置（CI/Docker/Nginx/规范）：**从数天缩短到数小时**；
- 样板 CRUD / 组件：编码时间约 **减少 40%~60%**；
- Bug 定位：从「反复试错」变为「AI 穷举假设 + 我快速验证」，排障时间 **减少约一半**；
- 代码/文档一致性提升，交接成本明显下降。

> 面试话术参考：「我把 AI 当结对程序员用，而不是代码生成器。我负责定义问题和验收标准，AI 负责发散方案和产出初稿，自动化 lint/test 做护栏，最终 correctness 由我兜底。」

---

## 7. 部署与 CI/CD

**部署架构**：阿里云 ECS（Docker Compose 编排 web / api / postgres / redis / meilisearch / nginx）+ OSS 存图 + CDN 加速 + Let's Encrypt HTTPS。

**CI/CD（[.github/workflows/ci.yml](.github/workflows/ci.yml)）**：

```
PR / push ─▶ ① ci：pnpm lint + test（前后端单测）
push dev  ─▶ ② build-push：构建 web/api 镜像 ─▶ 推送阿里云 ACR
push main ─▶ ③ deploy：SSH 到服务器 git checkout 指定 commit ─▶ deploy.sh
```

亮点：

- **分支即环境**：`dev → staging` 自动发布，`main → prod` 需**人工审批**（GitHub Environment 保护）；
- **基础设施镜像搬到 ACR**：CI 里把 postgres/redis/nginx/meilisearch 同步推送到阿里云镜像仓库，**绕开 Docker Hub 拉取超时**；
- **镜像双标签**：`<env>-<sha>`（精确版本，便于回滚）+ `<env>-latest`；
- **缓存与并发**：`cache-from/to: type=gha` 加速构建，`concurrency` 保证同分支不撞车；
- **构建产物优化**：Docker 4 阶段（base→deps→build→runtime）分层缓存，最终镜像只含运行时产物；后端用 `pnpm deploy --prod` 精简依赖。

---

## 8. 质量保障

- **单元测试**：Jest（API）+ Vitest（Web）+ Supertest（E2E 骨架）；
- **类型检查**：`tsc --noEmit` / `nuxt typecheck`，`@devshare/shared` 保证前后端类型一致；
- **提交门禁**：Husky + lint-staged + commitlint，规范 commit、自动格式化；
- **错误处理**：全局异常过滤器 + 业务错误码 + 前端 i18n 文案映射（中英一致）；
- **可观测性**：`/health` 健康检查；Nginx 访问日志；品牌化 404/5xx 双语错误页。

---

## 9. 成果与收获

- 从 0 到 1 交付一个**功能完整、可上线**的技术社区（账号/文章/互动/搜索/榜单/i18n/上传）；
- 掌握 **SSR 同构、水合原理、游标分页、虚拟列表、热度算法、缓存与写回**等核心能力；
- 建立完整 **DevOps 闭环**（规范 → 测试 → 构建 → 发布 → 运维）；
- 形成可复用的 **AI 辅助开发工作流**。

---

## 10. 面试高频追问 & 回答要点

**Q1：为什么选 Nuxt 而不是纯 Vue SPA？**

> 社区类产品依赖 SEO 与首屏速度，纯 SPA 首屏白屏且搜索引擎抓取差。Nuxt 的 SSR 能直出 HTML，同时用 routeRules 让重交互页保持 SPA，兼顾两者；Nitro 还内置 SWR 缓存，部署成本低。

**Q2：SSR 水合不一致怎么产生的？你怎么解决？**

> 见 4.2。核心是「服务端与客户端首帧渲染结果必须一致」。我遇到的四类原因：payload 二次请求、时间基准不同、localStorage 登录态、虚拟列表服务端无尺寸。分别用内联 payload、payload 同步 now、延迟渲染、SSR 静态渲染前 N 条解决。

**Q3：游标分页和 OFFSET 分页的区别？热点榜怎么用？**

> OFFSET 深翻页要扫描并丢弃前 N 条，性能随页码下降，且数据插入会错位。游标分页用「上一页最后一条的排序键」做 where 条件，走索引。热点榜排序键是 `(hotScore, id)`，用 id 做 tie-breaker 保证稳定。

**Q4：浏览量为什么用 Redis？一致性怎么保证？**

> 高频写不适合直接打 DB。Redis `INCR` 内存计数，展示时 MGET 增量叠加返回实时值，每小时重算时批量落库清零。属于最终一致，对浏览量这类非强一致指标完全可接受；服务宕机最坏丢最近一小时的增量。

**Q5：热度算法怎么设计的？为什么加 log 和时间衰减？**

> log 让幂律分布的长尾数据不被头部碾压；不同互动权重不同（评论/收藏 > 点赞 > 浏览）；除以 `(age+2)^1.5` 让新内容有机会、老内容不霸榜，`+2` 防止除零并平滑新文章。

**Q6：JWT 为什么还要 Refresh Token？**

> 短效 access token 减少泄露窗口，长效 refresh token 保证体验。refresh 存 Redis 且**轮换**，服务端可主动失效（登出/被盗）；放 httpOnly cookie 防 XSS 窃取。

**Q7：搜索结果会不会和数据库不一致？**

> 会有短暂延迟（异步索引），但发布/更新/删除都同步触发索引，且启动时全量回填；搜索服务故障时降级到 PostgreSQL 查询，保证功能可用。

**Q8：虚拟滚动怎么处理「不定高」？**

> 当前卡片高度固定（160+12），用 `estimateSize` 常量即可。若要支持不定高，可开启 TanStack Virtual 的动态测量（`measureElement`）配合 ResizeObserver，代价是滚动中需重算，我目前选择固定高度换取性能稳定。

**Q9：AI 写的代码你怎么保证质量？**

> 见 6.3。关键是自动化护栏（lint/test/typecheck）+ 人工 review 安全/并发/边界 + 小步提交可回滚。

**Q10：这个项目你觉得还有哪些不足 / 下一步优化？**

> ① 浏览量写回是最终一致，可引入消息队列解耦；② 搜索索引可改为监听数据库变更（CDC）而非业务内同步；③ 热点重算是全量遍历，文章量大后改为增量更新；④ 可补 CDN 图片处理、骨架屏；⑤ 测试覆盖率继续提升，补关键链路 E2E。

---

## 11. 附：简历精简段落（可直接粘贴）

> **DevShare 技术社区｜全栈开发｜个人项目**
>
> - 独立完成类掘金社区从 0 到 1 的设计与开发：Nuxt 4 SSR + NestJS + PostgreSQL + Redis + Meilisearch，pnpm monorepo 组织。
> - 解决 SSR **水合不一致**难题（payload 内联 / 时间同构 / 客户端态延迟渲染 / 虚拟列表分级渲染），首屏无闪烁且 SEO 友好。
> - 性能优化：虚拟滚动 + 触底预加载（DOM 千级→约 20）、游标分页 + 复合索引、浏览量 Redis 计数 + 定时写回、热点榜离线重算 + 缓存。
> - 设计类 HN 时间衰减热度算法，Redis 缓存 10 分钟，榜单接口毫秒级响应。
> - 搭建 JWT 双令牌轮换鉴权 + XSS 净化 + 限流 + OSS 图片上传，构建 Docker 多阶段镜像与 GitHub Actions 分级发布（dev→staging 自动、main→prod 人工审批）。
> - 深度使用 Claude Code 等 AI 工具，以「AI 产出 + 自动化护栏 + 人工 review」的工作流提升研发效率。

---

> 使用提示：把「【替换】」处补齐实测数据后，本文档即可作为面试自述稿与简历素材。建议按 4.2 / 4.4 / 4.5 / 4.6 / 第 6 章 重点准备深挖。
