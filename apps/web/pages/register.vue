<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const localePath = useLocalePath()
const toast = useToast()

const form = reactive({ username: '', email: '', password: '', confirm: '' })
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  if (form.password.length < 8) {
    error.value = t('auth.passwordMin')
    return
  }
  if (form.password !== form.confirm) {
    error.value = t('common.error')
    return
  }
  submitting.value = true
  try {
    await auth.register(form.username, form.email, form.password)
    toast.success(t('auth.registerSuccess'))
    await navigateTo(localePath('/'))
  } catch (e) {
    error.value = (e as Error & { code?: string }).message || t('common.error')
  } finally {
    submitting.value = false
  }
}

useHead({ title: `${t('auth.registerTitle')} - DevFlow` })
</script>

<template>
  <div class="max-w-sm mx-auto mt-10 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
    <h1 class="text-xl font-bold text-slate-900 mb-6">{{ t('auth.registerTitle') }}</h1>
    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <BaseInput v-model="form.username" :label="t('auth.username')" required />
      <BaseInput v-model="form.email" type="email" :label="t('auth.email')" required />
      <BaseInput v-model="form.password" type="password" :label="t('auth.password')" required />
      <BaseInput v-model="form.confirm" type="password" :label="t('auth.password')" required />
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <BaseButton type="submit" :loading="submitting" block>
        {{ t('auth.registerBtn') }}
      </BaseButton>
      <p class="text-sm text-slate-500 text-center">
        {{ t('auth.hasAccount') }}
        <NuxtLink :to="localePath('/login')" class="text-brand-600 hover:underline">
          {{ t('auth.goLogin') }}
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
