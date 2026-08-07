<script setup lang="ts">
import { CheckCircle2, Info, XCircle } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const icons = { success: CheckCircle2, error: XCircle, info: Info }
const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-brand-200 bg-brand-50 text-brand-700',
}
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm"
        :class="styles[toast.type]"
        @click="remove(toast.id)"
      >
        <component :is="icons[toast.type]" class="w-4 h-4 shrink-0" />
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
