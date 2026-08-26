<script setup lang="ts">
import type { ArticleDetail, TagDTO } from '@devshare/shared'
import { useAuthStore } from '~/stores/auth'

const MdEditor = defineAsyncComponent(async () => {
  const mod = await import('md-editor-v3')
  await import('md-editor-v3/lib/style.css')
  return mod.MdEditor
})

const route = useRoute()
const { t, locale } = useI18n()
const api = useApi()
const router = useRouter()
const localePath = useLocalePath()
const toast = useToast()
const auth = useAuthStore()

const articleId = computed(() => Number(route.params.id))
const saving = ref(false)
const uploading = ref(false)

const { data: article, pending } = await useAsyncData(`write-article-${articleId.value}`, () =>
  api.get<ArticleDetail>(`/articles/${articleId.value}`),
)

const form = reactive({
  title: '',
  summary: '',
  cover: '',
  contentMd: '',
  tagIds: [] as number[],
})

watch(article, (a) => {
  if (!a) return
  form.title = a.title
  form.summary = a.summary ?? ''
  form.cover = a.cover ?? ''
  form.contentMd = a.contentMd
  form.tagIds = a.tags.map((tag) => tag.id)
})

const { data: tags } = await useAsyncData('write-tags-edit', () => api.get<TagDTO[]>('/tags'))

const canEdit = computed(
  () =>
    article.value &&
    auth.user &&
    (article.value.author.id === auth.user.id || auth.user.role === 'admin'),
)

function toggleTag(id: number) {
  const idx = form.tagIds.indexOf(id)
  if (idx >= 0) form.tagIds.splice(idx, 1)
  else form.tagIds.push(id)
}

async function uploadCover(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<{ url: string }>('/uploads', fd, { headers: {} })
    form.cover = res.url
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function submit(publish: boolean) {
  if (!form.title.trim() || !form.contentMd.trim()) return
  saving.value = true
  try {
    const updated = await api.patch<ArticleDetail>(`/articles/${articleId.value}`, {
      title: form.title,
      summary: form.summary || undefined,
      cover: form.cover || undefined,
      contentMd: form.contentMd,
      tagIds: form.tagIds,
      publish,
    })
    toast.success(publish ? t('write.publishSuccess') : t('write.draftSuccess'))
    if (publish) router.push(localePath(`/article/${updated.id}`))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="max-w-4xl mx-auto flex flex-col gap-4">
    <BaseSkeleton class="h-10" />
    <BaseSkeleton class="h-96" />
  </div>

  <div v-else-if="article && canEdit" class="max-w-4xl mx-auto flex flex-col gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
      <BaseInput v-model="form.title" :placeholder="t('write.titlePlaceholder')" required />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="form.summary" :placeholder="t('write.summaryPlaceholder')" />
        <div class="flex items-center gap-3">
          <BaseInput v-model="form.cover" :placeholder="t('write.cover')" />
          <BaseButton size="sm" variant="secondary" :loading="uploading">
            <label class="cursor-pointer">
              {{ t('common.upload') }}
              <input type="file" accept="image/*" class="hidden" @change="uploadCover" />
            </label>
          </BaseButton>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags ?? []"
          :key="tag.id"
          type="button"
          class="px-2.5 py-1 rounded-full text-xs border transition-colors"
          :class="
            form.tagIds.includes(tag.id)
              ? 'border-brand-500 bg-brand-50 text-brand-600'
              : 'border-slate-200 text-slate-500 hover:border-brand-300'
          "
          @click="toggleTag(tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <ClientOnly>
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <MdEditor
          v-model="form.contentMd"
          :language="locale === 'zh' ? 'zh-CN' : 'en-US'"
          :toolbars="['bold', 'italic', 'strikeThrough', '-', 'title', 'quote', 'code', 'link', 'image', 'table', '=', 'revoke', 'next']"
          style="height: 520px"
        />
      </div>
    </ClientOnly>

    <div class="flex justify-end gap-3">
      <BaseButton variant="secondary" :loading="saving" @click="submit(false)">
        {{ t('write.saveDraft') }}
      </BaseButton>
      <BaseButton :loading="saving" @click="submit(true)">
        {{ t('write.publish') }}
      </BaseButton>
    </div>
  </div>

  <div v-else class="max-w-xl mx-auto">
    <BaseEmpty :text="t('errors.FORBIDDEN')" />
  </div>
</template>
