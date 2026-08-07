<script setup lang="ts">
withDefaults(defineProps<{ align?: 'left' | 'right' }>(), { align: 'left' })

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="root" class="relative inline-block">
    <div @click="open = !open">
      <slot name="trigger" />
    </div>
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute z-50 mt-2 min-w-40 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5"
        :class="align === 'right' ? 'right-0' : 'left-0'"
        @click="open = false"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
