<script setup lang="ts">
import type { ArticleListItem, Paginated, RankItem, TagDTO } from '@devflow/shared'

const { t } = useI18n()
const api = useApi()

const sort = ref<'latest' | 'hot'>('latest')
const items = ref<ArticleListItem[]>([])
const cursor = ref<string | null>(null)
const loading = ref(false)
const endReached = ref(false)

const { data: firstPage, pending: initialPending } = await useAsyncData('home-feed', () =>
  api.get<Paginated<ArticleListItem>>('/articles', { query: { sort: 'latest', limit: 20 } }),
)
const { data: rank } = await useAsyncData('home-rank', () =>
  api.get<RankItem[]>('/rank/hot', { query: { limit: 10 } }),
)
const { data: tags } = await useAsyncData('home-tags', () => api.get<TagDTO[]>('/tags'))

items.value = firstPage.value?.items ?? []
cursor.value = firstPage.value?.nextCursor ?? null

async function fetchFirstPage() {
  loading.value = true
  endReached.value = false
  try {
    const res = await api.get<Paginated<ArticleListItem>>('/articles', {
      query: { sort: sort.value, limit: 20 },
    })
    items.value = res.items
    cursor.value = res.nextCursor
  } finally {
    loading.value = false
  }
}

watch(sort, fetchFirstPage)

async function loadMore() {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const res = await api.get<Paginated<ArticleListItem>>('/articles', {
      query: { sort: sort.value, cursor: cursor.value ?? undefined, limit: 20 },
    })
    items.value.push(...res.items)
    cursor.value = res.nextCursor
    if (!res.nextCursor) endReached.value = true
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'DevFlow',
  meta: [
    {
      name: 'description',
      content: t('brand.slogan'),
    },
  ],
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
    <section class="bg-white rounded-xl border border-slate-200 p-4">
      <BaseTabs
        v-model="sort"
        :tabs="[
          { key: 'latest', label: t('home.feed') },
          { key: 'hot', label: t('home.hot') },
        ]"
        class="mb-4"
      />

      <div v-if="initialPending && items.length === 0" class="flex flex-col gap-3">
        <BaseSkeleton v-for="i in 5" :key="i" class="h-36 rounded-xl" />
      </div>

      <VirtualFeed
        v-else-if="items.length > 0"
        :items="items"
        :loading="loading"
        :end-reached="loadMore"
      >
        <template #item="{ item }">
          <ArticleCard :article="item as ArticleListItem" />
        </template>
      </VirtualFeed>

      <BaseEmpty v-else :text="t('home.empty')" />
    </section>

    <aside class="hidden lg:flex flex-col gap-6 sticky top-20">
      <HotRank :items="rank ?? []" />

      <section class="bg-white rounded-xl border border-slate-200 p-4">
        <h2 class="font-semibold text-slate-900 mb-3">{{ t('home.tagNav') }}</h2>
        <div class="flex flex-wrap gap-2">
          <BaseTag v-for="tag in tags ?? []" :key="tag.id" :name="tag.name" :slug="tag.slug" />
        </div>
      </section>
    </aside>
  </div>
</template>
