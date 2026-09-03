# DevShare Nuxt 学习指南（贴合项目）

> 面向想看懂/修改本项目前端的人。基于 Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS v4。
> 先读根目录 `README.md` 了解整体架构，再按本文顺序学习。

---

## 第 0 章：先建立心智模型——Nuxt 是什么

学任何 API 之前，先记住三句话：

1. **Nuxt = Vue + 约定式目录 + SSR 服务端 + 构建工具（Vite）+ 插件生态**，一个大而全的全栈框架。
2. **约定优于配置**：不需要手动写路由表、不需要手动引入组件。**文件放对位置，就自动生效**。
3. **同构（Isomorphic）**：同一份代码，既在服务器上跑（生成 HTML），又在浏览器里跑（交互）。这是 Nuxt 最核心、也最容易困惑的点。

> 动手前先把 [apps/web/package.json](../apps/web/package.json) 看一遍：`nuxt ^4.1.0` + `vue ^3.5` + `vue-router ^5` + `pinia` + `@nuxtjs/i18n` + `tailwindcss v4`。

---

## 第 1 章：目录结构——一切从"放对位置"开始

Nuxt 4 的核心目录就这几个，对照 [apps/web/](../apps/web/)：

| 目录 | 作用 | 项目里的例子 |
|------|------|------|
| `app.vue` | 应用根组件，所有页面的"外壳" | [app.vue](../apps/web/app.vue) 里只有 `<NuxtLayout>` + `<NuxtPage>` |
| `pages/` | **一个文件 = 一个路由** | [pages/index.vue](../apps/web/pages/index.vue) = `/` |
| `layouts/` | 页面布局（侧边栏/页头页脚） | [layouts/default.vue](../apps/web/layouts/default.vue) |
| `components/` | 组件，**自动引入**，不用 import | [components/AppHeader.vue](../apps/web/components/AppHeader.vue) |
| `composables/` | 组合函数，**自动引入** | [composables/useApi.ts](../apps/web/composables/useApi.ts) |
| `plugins/` | 应用启动时执行的插件 | [plugins/00.pinia.ts](../apps/web/plugins/00.pinia.ts) |
| `stores/` | Pinia 状态（项目约定，需手动 import） | [stores/auth.ts](../apps/web/stores/auth.ts) |
| `utils/` | 纯工具函数，**自动引入** | [utils/format.ts](../apps/web/utils/format.ts) |
| `assets/` | 静态资源/CSS | [assets/css/main.css](../apps/web/assets/css/main.css) |
| `i18n/` | 国际化语言包 | [i18n/locales/zh.json](../apps/web/i18n/locales/zh.json) |
| `nuxt.config.ts` | Nuxt 配置文件 | [nuxt.config.ts](../apps/web/nuxt.config.ts) |

**最重要的概念：自动引入（auto-import）。**
看 [pages/index.vue](../apps/web/pages/index.vue) 开头几行：

```vue
<script setup lang="ts">
import type { ArticleListItem, Paginated, RankItem, TagDTO } from '@devshare/shared'

const { t } = useI18n()        // 没有 import —— composables 自动引入
const api = useApi()           // 没有 import —— composables 自动引入
const sort = ref<'latest' | 'hot'>('latest')  // ref 也没 import —— Vue 组合式 API 自动引入
</script>
```

`useApi`、`useToast`、`ref`、`computed`、`onMounted`、`useHead`、`useRoute` 全都没写 import。这是 Nuxt（通过 unimport）自动注入的。`useI18n`、`useLocalePath` 是 i18n 模块注入的。

> **练习**：写一个 `composables/useCounter.ts`，然后在任意页面直接用 `useCounter()`，不用 import。

---

## 第 2 章：页面与路由（pages/）

### 2.1 静态路由

[pages/login.vue](../apps/web/pages/login.vue) → 路由 `/login`。一个 `.vue` 文件就是一个路由，文件路径就是 URL 路径。

### 2.2 动态路由 `[参数]`

看 [pages/article/[id].vue](../apps/web/pages/article/[id].vue)：

- 文件名 `[id].vue` → 匹配 `/article/123`，`123` 就是 `id`
- 取参数用 `useRoute()`：

```ts
const route = useRoute()
const articleId = computed(() => Number(route.params.id))
```

注意 `route.params` 是 `string | string[]`，所以转成 `Number`。

### 2.3 页面跳转

- **声明式**：用 `<NuxtLink to="...">`（替代 `<a>`，内置预取和 SPA 导航）。看 [ArticleCard.vue](../apps/web/components/ArticleCard.vue)：

```vue
<NuxtLink :to="localePath(`/article/${props.article.id}`)">
```

- **命令式**：用 `navigateTo()` 或 `useRouter().push()`。看 [login.vue](../apps/web/pages/login.vue)：

```ts
await navigateTo(redirect)
```

### 2.4 页面元信息（SEO）

`useHead()` 可以在页面里设置 `<title>`、meta 标签。看 [pages/index.vue](../apps/web/pages/index.vue)：

```ts
useHead({
  title: 'DevShare（技享）',
  meta: [{ name: 'description', content: t('brand.slogan') }],
})
```

注意 [article/[id].vue](../apps/web/pages/article/[id].vue) 用了**函数形式**——文章标题要等数据加载完才知道，函数会响应式重算。

---

## 第 3 章：布局与组件

### 3.1 布局（layouts/）

[layouts/default.vue](../apps/web/layouts/default.vue) 定义了全站外壳：页头 + 主内容区 + 页脚 + Toast。关键点：

```vue
<main class="...">
  <slot />          <!-- 页面内容会"填"进这里 -->
</main>
```

[app.vue](../apps/web/app.vue) 负责把布局和页面拼起来：

```vue
<NuxtLayout>
  <NuxtPage />
</NuxtLayout>
```

### 3.2 组件自动引入 + 目录前缀

[nuxt.config.ts](../apps/web/nuxt.config.ts) 里有特殊配置：

```ts
components: [{ path: '~/components', pathPrefix: false }]
```

`pathPrefix: false` 的意思是：`components/ui/BaseButton.vue` 的组件名就是 `BaseButton`（不带 `ui` 前缀）。所以在任何模板里直接写：

```vue
<BaseButton>...</BaseButton>
<BaseTabs v-model="sort" :tabs="tabs" />
```

都不需要 import。看 [pages/index.vue](../apps/web/pages/index.vue) 模板里用了一堆 `Base*` 组件全是自动引入的。

### 3.3 客户端专属组件

有些组件只该在浏览器跑（比如富文本编辑器、虚拟滚动），用 `<ClientOnly>` 包起来，SSR 阶段不渲染。看 [pages/write/index.vue](../apps/web/pages/write/index.vue)：

```vue
<ClientOnly>
  <MdEditor ... />
</ClientOnly>
```

再配合同文件的 `defineAsyncComponent` 做**按需异步加载**，把 md-editor 从首屏包体里摘出去。

### 3.4 组件间的插槽（slot）

看 [VirtualFeed.vue](../apps/web/components/VirtualFeed.vue)，它用 `<slot name="item" :item="items[item.index]" .../>` 把"每一条怎么渲染"交给父组件。父组件 [pages/index.vue](../apps/web/pages/index.vue) 这样填：

```vue
<VirtualFeed ...>
  <template #item="{ item }">
    <ArticleCard :article="item as ArticleListItem" />
  </template>
</VirtualFeed>
```

这是典型的**容器组件/渲染插槽**模式，学习重点是具名插槽 + 插槽 props。

---

## 第 4 章：数据获取（Nuxt 的灵魂）

这是 SSR 框架和纯 SPA 最大的区别，也是最容易踩坑的地方。

### 4.1 `useAsyncData`——SSR 时在服务器上取数据

看 [pages/index.vue](../apps/web/pages/index.vue)：

```ts
const { data: firstPage, pending: initialPending } = await useAsyncData('home-feed', () =>
  api.get<Paginated<ArticleListItem>>('/articles', { query: { sort: 'latest', limit: 20 } }),
)
```

**`await useAsyncData()` 做了什么**：

1. 第一次访问（服务器渲染）时，在**服务器上**发起请求
2. 把拿到的数据**一起序列化进 HTML**，发给浏览器
3. 浏览器端**不会重新请求**，直接用 HTML 里带的数据"激活"页面 → **首屏 SEO 好 + 加载快**

第一个参数 `'home-feed'` 是这条数据的**缓存 key**，用于去重。

### 4.2 什么时候数据会"重新请求"

- **客户端切换路由**（从首页点进另一篇文章）→ 新的 `useAsyncData` 在浏览器里跑
- **`refresh()` 手动刷新** → 看 [article/[id].vue](../apps/web/pages/article/[id].vue) 解构出来的 `refresh`
- **`useAsyncData` 的 key 相同** → 会复用已有数据（Nuxt 的去重机制）

### 4.3 关键区分：`import.meta.server` vs `import.meta.client`

这段代码在 [composables/useApi.ts](../apps/web/composables/useApi.ts)，是理解 SSR 的**最佳样例**：

```ts
function baseUrl(): string {
  if (import.meta.server) return config.apiBase as string       // 服务器端 → 直连后端 3001
  return config.public.apiBase as string                          // 浏览器端 → 走 /api 同源代理
}
```

同一份代码，**在服务器上跑时**取 `apiBase`（`http://127.0.0.1:3001/api/v1`），**在浏览器里跑时**取 `public.apiBase`（`/api/v1` 相对路径）。因为浏览器不能直接访问服务器内网的 3001 端口，必须走 nginx/Nitro 的同源代理。

### 4.4 混合渲染 routeRules——项目里最值得学的技巧

[nuxt.config.ts](../apps/web/nuxt.config.ts)：

```ts
routeRules: {
  '/': { swr: 60 },           // 首页：SSR + 缓存 60 秒
  '/article/**': { swr: 60 }, // 文章详情：SSR + 缓存
  '/write': { ssr: false },   // 写作页：纯 SPA
  '/settings': { ssr: false },
  '/login': { ssr: false },
  // ...
}
```

这是 Nuxt 的**混合渲染（Hybrid Rendering）**能力：

- **`swr: 60`** → 服务端渲染并缓存 60 秒，适合内容型页面（首页、文章详情），SEO 好、访问快
- **`ssr: false`** → 纯客户端 SPA，适合交互重的页面（登录、写作、设置），省服务器资源

每个路由都能单独定制渲染策略，这就是为什么 README 里写"SSR 首页 + 文章详情，其余 SPA"。

> **练习**：把首页 routeRules 从 `swr: 60` 改成 `ssr: false`，看下前后 HTML 源码（右键查看网页源代码）里有没有文章内容。体会 SSR vs SPA 的差异。

### 4.5 数据缓存机制：什么时候用缓存，什么时候重新请求

以首页 [pages/index.vue](../apps/web/pages/index.vue) 的 `useAsyncData('home-feed', ...)` 为例，常见的三种触发场景：

| 场景 | 走缓存还是重新请求 |
|------|--------------------|
| **首次访问 + 水合（hydration）** | ✅ 客户端复用服务端渲染时取的数据，**不重复请求** |
| **客户端路由切换回首页**（如从文章详情点返回） | 🔄 **重新请求新数据**，不用缓存 |
| **浏览器 F5 整页刷新** | 🔄 服务器重新渲染/取数，但受 `swr: 60` 的 HTML 缓存影响 |

#### 为什么"切回首页"会重新请求？

这是最容易误解的点。`useAsyncData` 的缓存读取逻辑（见 Nuxt 源码 `dist/app/composables/asyncData.js` 的 `getDefaultCachedData`）大致是：

```ts
if (nuxtApp.isHydrating) return nuxtApp.payload.data[key]   // 只有水合时才读 payload
return nuxtApp.static.data[key]                              // 否则只查 static（生成站点用）
```

- **水合（首次加载）** → 读 `payload.data`（服务端序列化进 HTML 的数据）→ 复用，避免"服务端取一次 + 客户端又取一次"
- **SPA 路由切换**（非水合）→ 只读 `static.data`（`nuxt generate` 静态站才有），SSR 应用里是空的 → 返回 `undefined` → 触发真实请求

另外，离开首页时组件卸载，`useAsyncData` 的清理逻辑会把该 key 标记失效。所以每次客户端导航回到首页，都会看到短暂骨架屏（`initialPending`），然后拉到新数据。

**结论**：Nuxt 的 payload 缓存只在"服务端渲染 → 浏览器水合"这一趟生效；之后的客户端导航，同 key 的 `useAsyncData` 默认重新请求。

#### F5 整页刷新为什么可能拿到旧数据？

F5 是整页请求，走服务器。此时 `routeRules` 的 `'/': { swr: 60 }` 生效（Nitro 的 SWR，stale-while-revalidate）：

- 距上次渲染 **< 60 秒** → 直接返回缓存的 HTML（数据可能是 60 秒内的旧值，不重新取数）
- 距上次渲染 **≥ 60 秒** → 本次先返回旧缓存，同时在**后台**重新渲染刷新缓存，下次访问即新数据
- **首次构建后**（无缓存）→ 等待完整渲染，服务器上 `useAsyncData` 重新请求 API

注意：这是**服务器端对 HTML 的缓存**，与上面 4.4 的 routeRules 相关，和客户端 `useAsyncData` 的缓存是两回事。

#### 想让"切回首页"用缓存怎么做？

默认行为是重新加载。如果你想要"回到首页先用旧数据秒开，再后台刷新"，给 `useAsyncData` 传 `getCachedData`：

```ts
const { data: firstPage } = await useAsyncData('home-feed', () =>
  api.get<Paginated<ArticleListItem>>('/articles', { query: { sort: 'latest', limit: 20 } }),
  {
    getCachedData(key, nuxtApp) {
      return nuxtApp.payload.data[key]   // 复用上次留在 payload 里的数据
    },
  },
)
```

也可以配合 `useNuxtData('home-feed')` 单独读取某 key 最近一次的数据（比如先展示旧数据再调用 `refresh()`）。

### 4.6 payload 长什么样？为什么 HTML 里是一段"看不懂的数组"

打开首页 F12 查看 HTML，会看到一个 `<script id="__NUXT_DATA__">` 标签，里面是一段奇怪的数组而不是好读的 JSON：

```html
<script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true"
        id="__NUXT_DATA__" data-src="/_payload.json?_b=dev">
  [ { "state": 1, "once": 10, "_errors": 11, "serverRendered": 6, "path": 13, "prerenderedAt": -1 }, ... ]
</script>
```

#### 为什么不是普通 JSON？——Nuxt 用 devalue 序列化

Nuxt 用 **devalue**（Svelte 团队的紧凑序列化库）把 payload 编码成数组。原因：

1. **省体积**：整个 payload 是一个数组，**重复值只存一次，别处用下标引用**（而 JSON 会完整重复）
2. **能表达 JSON 表达不了的类型**：`Set`、`Map`、`Date`、响应式代理（Reactive）——JSON 分不清普通对象和 reactive，devalue 用 `["Reactive", 2]` 这样的标记还原
3. **`-1` 表示 null**：比 `"null"` 更省字符

**读法规则**：

- 数组**第 0 项是根对象**，它的属性值 = 指向数组里其他元素的下标
- `-1` = null
- `["Reactive", 2]` = 被 reactive 包裹的对象，内容在数组下标 2
- `["Set"]` = 空 Set
- 特殊字符用 `\uXXXX` 转义（`"/"` = `/`）

用首页真实 payload 举例（已省略部分内容）：

```js
[
  0: { state: 1, once: 10, _errors: 11, serverRendered: 6, path: 13, prerenderedAt: -1 },  // 根对象：目录
  1: ["Reactive", 2],          // state 是 reactive，内容在 [2]
  2: { "$si18n:cached-locale-configs": 3, "$si18n:resolved-locale": 9 },  // i18n 模块塞的状态
  3: { "zh": 4, "en": 7 },      // 缓存了 zh/en 两种 locale 配置
  6: true,                      // serverRendered / cacheable
  10: ["Set"],                  // once = 空 Set
  11: ["ShallowReactive", 12],  // _errors 是 shallowReactive
  12: { "home-feed": -1, "home-rank": -1, "home-tags": -1 },  // 三个异步请求都无错误
  13: "/",                      // path = "/"，这是首页
]
```

翻译成人话：**"我是首页。服务端渲染完成。i18n 缓存了 zh/en 配置。首页三个异步请求 home-feed/home-rank/home-tags 都没有报错。"**

#### 为什么真正的文章数据不在内联 payload 里？

注意 script 标签上的 `data-src="/_payload.json?_b=dev"`：**重数据被"外包"到独立的 `/_payload.json` 文件**，浏览器水合时再 fetch 回来合并。内联这段只留轻量元信息（i18n 状态、错误标记、路径）。

```js
const inlineData   = parse(el.textContent)              // 读内联（轻量元信息）
const externalData = el.dataset.src ? await fetch('/_payload.json?...') : undefined  // 重数据
payloadCache = { ...inlineData, ...externalData, ... }
```

好处：HTML 里的 script 保持轻量、利于缓存；首页 `swr: 60` 时 HTML 缓存和数据文件缓存可以分开处理。

> **动手看**：F12 → Network → 找 `_payload.json?_b=dev`，打开能看到 home-feed/home-rank/home-tags 的**真实文章数据**，同样是这种下标数组格式（只是更大）。

---

## 第 5 章：状态管理（Pinia）

### 5.1 怎么接入 Nuxt

用插件方式注册 Pinia，看 [plugins/00.pinia.ts](../apps/web/plugins/00.pinia.ts)：

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createPinia())
})
```

文件名 `00.` 前缀是**加载顺序控制**（数字小的先执行）。`auth` 插件依赖 Pinia，所以它叫 [plugins/auth.client.ts](../apps/web/plugins/auth.client.ts)——比 `00` 晚。

### 5.2 状态仓库写法

[stores/auth.ts](../apps/web/stores/auth.ts) 是标准的 Options 风格 Pinia：

```ts
export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '', user: null as UserProfile | null, ready: false }),
  getters: { isLoggedIn: (state) => Boolean(state.token) },
  actions: { async login() {...}, async logout() {...} },
})
```

组件里使用：

```ts
const auth = useAuthStore()          // 见 login.vue
auth.login(form.email, form.password)
auth.isLoggedIn                       // 响应式 getter
```

### 5.3 SSR 注意事项（重要坑）

`stores/auth.ts` 里有大量 `import.meta.client` 判断。原因是：

- **localStorage 只在浏览器存在**，服务器上跑会报错
- 服务器渲染时初始化 token 是没意义的（每次请求都是新的服务器环境）
- 所以登录态在**客户端插件**里初始化：`plugins/auth.client.ts` 的 `.client.ts` 后缀表示**只在浏览器执行**

```ts
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  await auth.init()   // 从 localStorage 读 token、拉用户信息
})
```

---

## 第 6 章：Composables（自定义组合函数）

### 6.1 `useApi`——统一 API 封装

[composables/useApi.ts](../apps/web/composables/useApi.ts) 是全项目请求的统一入口。它封装了：

- **环境切换**（`import.meta.server`，前面讲过）
- **自动带 token**（`headers.Authorization = Bearer ...`）
- **401 自动刷新**（token 过期时调 `auth.refresh()` 重试一次）
- **错误统一翻译**（把后端的错误 code 转成 i18n 文案 + toast 提示）
- **泛型返回值**（`api.get<Paginated<ArticleListItem>>(...)`，类型安全）

这就是 Nuxt 生态里推荐的封装方式：基于 `$fetch`（Nuxt 内置，处理了 cookie、SSR 兼容等）。

### 6.2 `useToast`——模块级共享状态的巧妙用法

看 [composables/useToast.ts](../apps/web/composables/useToast.ts)，它没有用 Pinia，而是在**模块顶层**维护一个 `ref`：

```ts
const toasts = ref<ToastItem[]>([])
export function useToast() {
  function push(type, message) { toasts.value.push(...) }
  return { toasts, success, error, info, remove }
}
```

因为 Nuxt 的 composables 是单例模块，`toasts` 是全局唯一的。任何组件调用 `useToast()` 拿到的是**同一个数组**。`BaseToast.vue` 渲染这个数组，任何地方 `toast.success('...')` 都会弹出提示。

> **学习要点**：composables 返回值里的 `ref` 是响应式的，模板里直接用 `useToast().toasts` 就能实时渲染。

---

## 第 7 章：运行时配置与代理

### 7.1 runtimeConfig

[nuxt.config.ts](../apps/web/nuxt.config.ts)：

```ts
runtimeConfig: {
  apiBase: 'http://127.0.0.1:3001/api/v1',        // 服务端可用，环境变量 NUXT_API_BASE
  public: {
    apiBase: '/api/v1',                          // 客户端可用（public 前缀），环境变量 NUXT_PUBLIC_API_BASE
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
}
```

**规则**：`public` 下的配置会暴露给浏览器，非 public 的只在服务器端可用。环境变量名会自动对应 `NUXT_API_BASE`、`NUXT_PUBLIC_SITE_URL`。用 `useRuntimeConfig()` 读取，见 `useApi.ts`。

### 7.2 dev 代理（Nitro devProxy）

[nuxt.config.ts](../apps/web/nuxt.config.ts)：

```ts
nitro: {
  devProxy: {
    '/api': { target: 'http://127.0.0.1:3001/api', changeOrigin: true },
  },
}
```

开发时浏览器请求 `/api/v1/...`，Nitro 开发服务器代理转发到后端 3001。生产环境则由 nginx 做同样的事（看 [deploy/](../deploy/)）。**这就是为什么浏览器端 apiBase 用相对路径 `/api/v1` 也能通**。

---

## 第 8 章：国际化（i18n）

### 8.1 配置

[nuxt.config.ts](../apps/web/nuxt.config.ts) 配置了 `@nuxtjs/i18n`：

```ts
i18n: {
  strategy: 'prefix_except_default',   // 中文无前缀(/)、英文带 /en 前缀
  defaultLocale: 'zh',
  locales: [{ code: 'zh', file: 'zh.json' }, { code: 'en', file: 'en.json' }],
  detectBrowserLanguage: { useCookie: true, cookieKey: 'df_locale', ... },
}
```

### 8.2 用法（项目里的三个关键 API）

看 [AppHeader.vue](../apps/web/components/AppHeader.vue)：

```ts
const { t, locale, setLocale } = useI18n()   // 翻译函数 + 当前语言 + 切换语言
const localePath = useLocalePath()            // 生成带语言前缀的路径
```

- **`t('nav.home')`** → 从 [zh.json](../apps/web/i18n/locales/zh.json) 里查 `nav.home` 的值
- **`localePath('/')`** → 当前是 en 时返回 `/en`
- **`setLocale('en')`** → 切换语言（AppHeader 下拉切换）
- **`locale`** → 当前语言，用于 `timeAgo(article.publishedAt, locale)`（[utils/format.ts](../apps/web/utils/format.ts) 里根据语言返回中文/英文时间）

错误提示也走 i18n：[useApi.ts](../apps/web/composables/useApi.ts) 里 `i18n.t(\`errors.${code}\`)`，后端返回 `UNAUTHORIZED`，前端就显示 [zh.json](../apps/web/i18n/locales/zh.json) 里 `errors.UNAUTHORIZED` 的"请先登录"。

---

## 第 9 章：TypeScript 与测试

### 9.1 类型是自动生成的

[apps/web/tsconfig.json](../apps/web/tsconfig.json)：

```json
{ "extends": "./.nuxt/tsconfig.json" }
```

每次 `nuxt dev`/`prepare` 会生成 `.nuxt/` 目录，里面包含所有自动引入的类型声明。所以 `useApi()`、`BaseButton` 等都能类型检查。lint 用 `nuxt typecheck`（= vue-tsc），见 [package.json](../apps/web/package.json) 的 `lint` 脚本。

### 9.2 共享类型来自 shared 包

看 [stores/auth.ts](../apps/web/stores/auth.ts)：

```ts
import type { ApiErrorBody, UserProfile } from '@devshare/shared'
```

类型定义在 `packages/shared/src/index.ts`（monorepo workspace 包），前后端共用，保证 API 契约一致。

### 9.3 单测：Vitest

[vitest.config.ts](../apps/web/vitest.config.ts) 只测 `utils/**/*.spec.ts`。看 [utils/format.spec.ts](../apps/web/utils/format.spec.ts)（纯函数测试，最简单好学的样例）。跑测试用 `pnpm --filter @devshare/web test`。

---

## 第 10 章：部署视角（把前面学的串起来）

看 [apps/web/Dockerfile](../apps/web/Dockerfile)：

| 阶段 | 做了什么 | 对应 Nuxt 概念 |
|------|---------|---------------|
| base | 装 pnpm、系统库 | 环境准备 |
| deps | `pnpm install --ignore-scripts` | 只装依赖，不跑编译 |
| build | `pnpm --filter @devshare/shared build` + `pnpm --filter @devshare/web build` | 编译 shared + Nuxt 构建，产物在 `apps/web/.output` |
| runtime | 只拷 `.output`，`node .output/server/index.mjs` | **Nitro 服务器**——Nuxt SSR 的服务端就长这样 |

关键点：**Nuxt 构建产物 `.output/` 里就是一个可直接 `node` 启动的 Nitro 服务器**，内置路由、SSR、静态资源托管，不需要额外装 Node 框架。生产环境前面再挂 nginx（看 [deploy/](../deploy/)）。

CI 里 [ci.yml](../.github/workflows/ci.yml) 的 `pnpm lint` 和 `pnpm test` 在 CI 任务中执行，镜像构建在 build-push 任务。

---

## 建议的学习路径（按顺序）

1. **第 0-2 章**：看懂目录结构、pages 路由、`useRoute`/`NuxtLink` —— 先能看懂"页面从哪来到哪去"
2. **第 3 章**：components 自动引入 + 插槽 —— 看懂组件体系
3. **第 4 章（最重要，多花时间）**：`useAsyncData` + `import.meta.server/client` + routeRules —— 搞懂 SSR 数据流，这是 Nuxt 和纯 Vue 的根本区别
4. **第 5-6 章**：Pinia + composables —— 看懂状态和请求封装
5. **第 7-8 章**：runtimeConfig + i18n —— 看懂配置项
6. **第 9-10 章**：类型/测试/部署 —— 综合

## 动手实验建议

1. 新加一个 `pages/hello.vue`，写个 `useHead` + `useAsyncData`，访问 `/hello`
2. 把首页 `routeRules` 的 `swr` 改成 `ssr: false`，对比网页源码差异（最能理解 SSR 的练习）
3. 写一个 `composables/useCounter.ts`，验证自动引入
4. 在 `components/` 加一个 `MyCard.vue`，在任何页面直接用（验证 `pathPrefix: false`）
5. 改 [i18n/locales/zh.json](../apps/web/i18n/locales/zh.json) 加一条文案，在页面用 `t()` 显示，再切英文

---

## 参考

- Nuxt 官方文档：https://nuxt.com/docs
- Vue 3 组合式 API：https://cn.vuejs.org/guide/introduction.html
- Pinia：https://pinia.vuejs.org/
- vue-i18n / @nuxtjs/i18n：https://i18n.nuxtjs.org/

