import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  ssr: true,
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // 服务端直连 API（容器内网 / 本地 dev 地址）
    apiBase: process.env.API_INTERNAL_URL || 'http://localhost:3001',
    public: {
      // 浏览器侧走同源代理（nginx / nitro devProxy）
      apiBase: '/api/v1',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  routeRules: {
    // SSR + SWR：首页与文章详情做服务端渲染并缓存
    '/': { swr: 60 },
    '/article/**': { swr: 60 },
    '/en': { swr: 60 },
    '/en/article/**': { swr: 60 },
    // 其余重交互页面保持 SPA，减少服务端渲染开销
    '/write': { ssr: false },
    '/write/**': { ssr: false },
    '/settings': { ssr: false },
    '/user/**': { ssr: false },
    '/search': { ssr: false },
    '/tag/**': { ssr: false },
    '/login': { ssr: false },
    '/register': { ssr: false },
    '/dev/**': { ssr: false },
  },

  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'zh',
    locales: [
      { code: 'zh', name: '中文', language: 'zh-CN', file: 'zh.json' },
      { code: 'en', name: 'English', language: 'en', file: 'en.json' },
    ],
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'df_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'zh',
    },
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
})
