import { useHydrated } from '~/composables/useHydrated'

export default defineNuxtPlugin((nuxtApp) => {
  const hydrated = useHydrated()
  nuxtApp.hook('app:mounted', () => {
    hydrated.value = true
  })
})
