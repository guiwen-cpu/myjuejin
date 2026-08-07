<script setup lang="ts">
import { User } from 'lucide-vue-next'

withDefaults(defineProps<{ src?: string | null; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), {
  size: 'md',
})

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
}
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700 overflow-hidden shrink-0"
    :class="sizes[size]"
  >
    <img v-if="src" :src="src" :alt="name ?? 'avatar'" class="w-full h-full object-cover" loading="lazy" />
    <User v-else class="w-1/2 h-1/2" />
  </span>
</template>
