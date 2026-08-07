<script setup lang="ts">
import type { UserProfile } from '@devflow/shared'
import { useAuthStore } from '~/stores/auth'

const { t, setLocale } = useI18n()
const api = useApi()
const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  username: auth.user?.username ?? '',
  bio: auth.user?.bio ?? '',
  avatar: auth.user?.avatar ?? '',
  locale: auth.user?.locale ?? 'zh',
})
const saving = ref(false)
const uploading = ref(false)

async function uploadAvatar(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<{ url: string; mode: 'oss' | 'local' }>('/uploads', fd, {
      headers: {},
    })
    form.avatar = res.url
    toast.success(t('common.saved'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function save() {
  saving.value = true
  try {
    const updated = await api.patch<UserProfile>('/users/me', {
      username: form.username,
      bio: form.bio,
      avatar: form.avatar || undefined,
      locale: form.locale,
    })
    auth.user = updated
    setLocale(updated.locale)
    toast.success(t('common.saved'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-6">
    <h1 class="text-xl font-bold text-slate-900 mb-6">{{ t('nav.settings') }}</h1>

    <div class="flex items-center gap-4 mb-6">
      <BaseAvatar :src="form.avatar" :name="form.username" size="lg" />
      <div class="flex flex-col gap-2">
        <BaseButton size="sm" variant="secondary" :loading="uploading">
          <label class="cursor-pointer">
            {{ t('common.upload') }}
            <input type="file" accept="image/*" class="hidden" @change="uploadAvatar" />
          </label>
        </BaseButton>
        <span class="text-xs text-slate-400">PNG / JPG / WebP ≤ 5MB</span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <BaseInput v-model="form.username" :label="t('auth.username')" required />
      <BaseTextarea v-model="form.bio" :label="t('write.summary')" :rows="3" />
      <BaseSelect
        v-model="form.locale"
        :label="t('nav.language')"
        :options="[
          { value: 'zh', label: t('nav.zh') },
          { value: 'en', label: t('nav.en') },
        ]"
      />
      <BaseButton :loading="saving" @click="save">
        {{ t('common.save') }}
      </BaseButton>
    </div>
  </div>
</template>
