<script setup lang="ts">
withDefaults(defineProps<{ name: string; slug: string; size?: 'sm' | 'md' }>(), { size: 'sm' })
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/tag/${slug}`)"
    class="inline-flex items-center rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
    :class="size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'"
  >
    {{ name }}
  </NuxtLink>
</template>
