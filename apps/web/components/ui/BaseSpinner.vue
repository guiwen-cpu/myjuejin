<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
</script>

<template>
  <div
    class="rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"
    :class="sizes[size]"
  />
</template>
