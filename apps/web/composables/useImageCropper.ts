import type { UploadImgCallBack } from 'md-editor-v3'
import { useUpload } from '~/composables/useUpload'

export function useImageCropper() {
  const { uploadImage } = useUpload()

  const open = ref(false)
  const src = ref('')
  const title = ref('')
  const aspectRatio = ref<number | null>(null)

  let queue: File[] = []
  let insertCb: UploadImgCallBack | null = null

  function openCropper(
    files: File[],
    insert: UploadImgCallBack | null,
    options: { title?: string; aspectRatio?: number } = {},
  ) {
    queue = files.slice()
    insertCb = insert
    title.value = options.title ?? ''
    aspectRatio.value = options.aspectRatio ?? null
    showNext()
  }

  function showNext() {
    const file = queue.shift()
    if (!file) {
      close()
      return
    }
    if (src.value) URL.revokeObjectURL(src.value)
    src.value = URL.createObjectURL(file)
    open.value = true
  }

  function close() {
    open.value = false
    if (src.value) {
      URL.revokeObjectURL(src.value)
      src.value = ''
    }
    queue = []
    insertCb = null
  }

  function cancel() {
    close()
  }

  async function confirm(file: File) {
    try {
      const url = await uploadImage(file)
      insertCb?.([url])
    } catch {
      // 上传失败已由 useApi 弹出提示，这里静默跳过并继续处理队列
    } finally {
      showNext()
    }
  }

  return { open, src, title, aspectRatio, openCropper, close, cancel, confirm }
}
