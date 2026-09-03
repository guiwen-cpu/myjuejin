import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Nuxt 页面常见单数命名（index.vue、[slug].vue），关闭多词组件名限制
    'vue/multi-word-component-names': 'off',
  },
})
