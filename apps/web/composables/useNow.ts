// SSR 生成一次当前时间基准，并通过 Nuxt payload 同步给客户端。
// 服务端与客户端 hydration 使用同一个 now，避免相对时间导致 mismatch；
// 客户端挂载后每分钟刷新一次，保持时间显示实时。
let started = false

export function useNow() {
  const now = useState<number>('hydrate-now', () => Date.now())

  if (import.meta.client && !started) {
    started = true
    onMounted(() => {
      setInterval(() => {
        now.value = Date.now()
      }, 60_000)
    })
  }

  return now
}
