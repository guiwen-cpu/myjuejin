<script setup lang="ts">
import { BRAND } from '@devflow/shared'

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-bold text-xs">
          {{ BRAND.name.charAt(0) }}
        </span>
        <span>{{ t('footer.desc') }}</span>
      </div>
      <div class="flex items-center gap-4">
        <span>{{ t('footer.icp') }}</span>
        <a href="https://github.com" target="_blank" rel="noopener" class="hover:text-brand-600">GitHub</a>
        <NuxtLink :to="localePath('/dev/components')" class="hover:text-brand-600">
          {{ t('dev.title') }}
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
