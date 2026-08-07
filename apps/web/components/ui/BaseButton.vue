<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    block: false,
    disabled: false,
    type: 'button',
  },
)

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:hover:bg-brand-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-brand-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1',
  md: 'text-sm px-4 py-2 rounded-lg gap-1.5',
  lg: 'text-base px-5 py-2.5 rounded-xl gap-2',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium transition-colors select-none disabled:opacity-60 disabled:cursor-not-allowed"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
