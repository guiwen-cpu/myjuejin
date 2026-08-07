<script setup lang="ts">
defineProps<{
  tabs: { key: string; label: string }[]
  modelValue?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-1 border-b border-slate-200">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
      :class="
        modelValue === tab.key
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      "
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
