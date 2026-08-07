<script setup lang="ts">
defineProps<{
  modelValue?: string | number
  label?: string
  options: { value: string | number; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="block text-sm font-medium text-slate-700 mb-1.5">{{ label }}</span>
    <select
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>
