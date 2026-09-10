<script setup lang="ts">
import { ArrowRight, PenLine } from 'lucide-vue-next'

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section
    class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 p-5 text-white shadow-sm"
  >
    <div
      class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl"
      aria-hidden="true"
    />
    <div class="relative">
      <span
        class="inline-flex w-9 h-9 rounded-xl bg-white/15 backdrop-blur items-center justify-center mb-3"
      >
        <PenLine class="w-5 h-5" />
      </span>
      <h2 class="font-bold text-lg leading-snug">{{ t('home.cta.title') }}</h2>
      <p class="mt-1 text-sm text-white/85 leading-relaxed">{{ t('home.cta.desc') }}</p>
      <NuxtLink
        :to="localePath('/write')"
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white text-brand-600 px-3.5 py-2 text-sm font-semibold hover:bg-brand-50 transition-colors"
      >
        {{ t('home.cta.write') }}
        <ArrowRight class="w-4 h-4" />
      </NuxtLink>
    </div>
  </section>
</template>
