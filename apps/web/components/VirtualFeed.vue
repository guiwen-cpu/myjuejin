<script setup lang="ts">
import { useVirtualizer, type VirtualizerOptions } from '@tanstack/vue-virtual'

const props = withDefaults(
  defineProps<{
    items: unknown[]
    itemHeight?: number
    overscan?: number
    loading?: boolean
    endReached?: () => void
  }>(),
  {
    itemHeight: 144,
    overscan: 8,
    loading: false,
  },
)

const parentRef = ref<HTMLElement | null>(null)
const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})

const virtualizer = useVirtualizer({
  count: props.items.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => props.itemHeight,
  overscan: props.overscan,
})

watch(
  () => props.items.length,
  (count) => {
    virtualizer.value?.setOptions({
      count,
      getScrollElement: () => parentRef.value,
      estimateSize: () => props.itemHeight,
      overscan: props.overscan,
    } as unknown as VirtualizerOptions<HTMLElement, Element>)
  },
)

watch(
  () => (virtualizer.value?.getVirtualItems() ?? []).map((v) => v.index),
  (indices) => {
    const lastIndex = indices[indices.length - 1]
    if (lastIndex !== undefined && lastIndex >= props.items.length - 5) {
      props.endReached?.()
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div>
    <!-- SSR 首屏静态渲染前 12 条，客户端激活后切换为虚拟滚动 -->
    <div v-if="!hydrated" class="flex flex-col gap-3">
      <slot v-for="(item, index) in items.slice(0, 12)" :key="index" name="item" :item="item" :index="index" />
    </div>

    <div v-else ref="parentRef" class="overflow-auto" :style="{ height: 'calc(100vh - 240px)' }">
      <div class="relative" :style="{ height: virtualizer.getTotalSize() + 'px' }">
        <div
          v-for="item in virtualizer.getVirtualItems()"
          :key="String(item.key)"
          class="absolute top-0 left-0 w-full"
          :style="{ transform: `translateY(${item.start}px)` }"
        >
          <div class="px-0.5 pb-3">
            <slot name="item" :item="items[item.index]" :index="item.index" />
          </div>
        </div>
      </div>
      <div v-if="loading" class="flex justify-center py-4">
        <BaseSpinner size="sm" />
      </div>
    </div>
  </div>
</template>
