import type { ApiErrorBody } from '@devflow/shared'
import { useAuthStore } from '~/stores/auth'

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  headers?: Record<string, string>
  auth?: boolean
}

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const i18n = useI18n()
  const toast = useToast()

  function baseUrl(): string {
    if (import.meta.server) return config.apiBase as string
    return config.public.apiBase as string
  }

  async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) }
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`

    try {
      const response = await $fetch.raw<{ data: T }>(`${baseUrl()}${path}`, {
        method: options.method ?? 'GET',
        body: options.body as Record<string, any> | BodyInit | undefined,
        query: options.query,
        headers,
        credentials: 'include',
        retry: 0,
      })
      return (response._data as { data: T } | undefined)?.data ?? (response._data as T)
    } catch (err) {
      const body = (err as { data?: ApiErrorBody })?.data
      const code = body?.code
      if (code === 'UNAUTHORIZED' && auth.token && import.meta.client) {
        const refreshed = await auth.refresh()
        if (refreshed) return request<T>(path, options)
      }
      const message = code ? i18n.t(`errors.${code}`) : i18n.t('common.error')
      toast.error(message)
      throw err
    }
  }

  return {
    get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'PATCH', body }),
    del: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' }),
    request,
  }
}
