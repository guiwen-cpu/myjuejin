import { useApi } from '~/composables/useApi'

export function useUpload() {
  const api = useApi()

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<{ url: string }>('/uploads', fd, { headers: {} })
    return res.url
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      urls.push(await uploadImage(file))
    }
    return urls
  }

  return { uploadImage, uploadImages }
}
