<script setup lang="ts">
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps<{
  open: boolean
  src: string
  title: string
  aspectRatio?: number | null
}>()

const emit = defineEmits<{
  (e: 'confirm', file: File): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

const imageEl = ref<HTMLImageElement | null>(null)
let cropper: Cropper | null = null
const cropping = ref(false)

function initCropper() {
  if (!imageEl.value) return
  cropper?.destroy()
  cropper = new Cropper(imageEl.value, {
    viewMode: 1,
    dragMode: 'move',
    autoCrop: true,
    autoCropArea: 0.8,
    background: false,
    aspectRatio: props.aspectRatio ?? undefined,
    movable: true,
    rotatable: false,
    scalable: false,
    zoomable: true,
  })
}

function destroyCropper() {
  cropper?.destroy()
  cropper = null
}

function waitImgLoad(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    if (img.complete) {
      resolve()
      return
    }
    img.addEventListener('load', () => resolve(), { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
  })
}

watch(
  () => [props.open, props.src] as const,
  async () => {
    if (props.open && props.src) {
      await nextTick()
      const img = imageEl.value
      if (img) {
        await waitImgLoad(img)
        initCropper()
      }
    } else {
      destroyCropper()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  destroyCropper()
})

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  if (!cropper) return
  cropping.value = true
  const canvas = cropper.getCroppedCanvas({
    maxWidth: 2048,
    maxHeight: 2048,
    imageSmoothingQuality: 'high',
  })
  canvas.toBlob(
    (blob) => {
      cropping.value = false
      if (!blob) return
      const file = new File([blob], 'cropped.png', { type: 'image/png' })
      emit('confirm', file)
    },
    'image/png',
    0.9,
  )
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && src"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      @click.self="handleCancel"
    >
      <div class="flex w-full max-w-2xl flex-col rounded-xl bg-white p-4 shadow-xl">
        <h3 class="mb-3 text-base font-semibold text-slate-800">{{ title }}</h3>
        <div
          class="relative h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <img ref="imageEl" :src="src" alt="" class="block max-h-[420px] max-w-full" />
        </div>
        <div class="mt-4 flex justify-end gap-3">
          <BaseButton variant="secondary" @click="handleCancel">{{
            t('common.cancel')
          }}</BaseButton>
          <BaseButton :loading="cropping" @click="handleConfirm">{{
            t('common.confirm')
          }}</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
