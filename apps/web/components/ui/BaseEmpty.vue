<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{ text?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-slate-400">
    <Inbox class="w-10 h-10 mb-3" />
    <p class="text-sm">{{ text }}</p>
  </div>
</template>
