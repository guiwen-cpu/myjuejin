<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="block text-sm font-medium text-slate-700 mb-1.5">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </span>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows ?? 4"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 resize-y"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </label>
</template>
