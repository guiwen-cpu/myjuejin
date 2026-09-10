<script setup lang="ts">
import { DEFAULT_TAGS, type ArticleListItem, type Paginated } from '@devshare/shared'

const route = useRoute()
const { t } = useI18n()
const api = useApi()

const slug = computed(() => String(route.params.slug))
// 当前标签的展示名：命中预设标签显示中文名，未知 slug 直接显示 slug
const tagLabel = computed(
  () => DEFAULT_TAGS.find((item) => item.slug === slug.value)?.name ?? slug.value,
)
const items = ref<ArticleListItem[]>([])
const cursor = ref<string | null>(null)
const loading = ref(false)
const endReached = ref(false)

async function fetchFirst() {
  loading.value = true
  endReached.value = false
  try {
    const res = await api.get<Paginated<ArticleListItem>>('/articles', {
      query: { tag: slug.value, limit: 20 },
    })
    items.value = res.items
    cursor.value = res.nextCursor
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const res = await api.get<Paginated<ArticleListItem>>('/articles', {
      query: { tag: slug.value, cursor: cursor.value ?? undefined, limit: 20 },
    })
    items.value.push(...res.items)
    cursor.value = res.nextCursor
    if (!res.nextCursor) endReached.value = true
  } finally {
    loading.value = false
  }
}

watch(slug, fetchFirst, { immediate: true })

// 用函数写法：切换 /tag/:slug 或切换语言时自动更新 document.title
useHead(() => ({ title: `${tagLabel.value} - DevShare` }))
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-xl font-bold text-slate-900 mb-4">
      # {{ DEFAULT_TAGS.find((t) => t.slug === slug)?.name ?? slug }}
    </h1>
    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div v-if="items.length > 0">
        <VirtualFeed :items="items" :loading="loading" :end-reached="loadMore">
          <template #item="{ item }">
            <ArticleCard :article="item as ArticleListItem" />
          </template>
        </VirtualFeed>
      </div>
      <BaseEmpty v-else-if="!loading" :text="t('home.empty')" />
    </div>
  </div>
</template>
