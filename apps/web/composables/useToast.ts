interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const toasts = ref<ToastItem[]>([])
let seed = 0

export function useToast() {
  function push(type: ToastItem['type'], message: string) {
    if (!import.meta.client) return
    const id = ++seed
    toasts.value.push({ id, type, message })
    window.setTimeout(() => remove(id), 3200)
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
    remove,
  }
}
