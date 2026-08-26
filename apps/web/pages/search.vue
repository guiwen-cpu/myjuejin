<script setup lang="ts">
import { User } from 'lucide-vue-next'
import type { SearchResult } from '@devshare/shared'

const route = useRoute()
const { t } = useI18n()
const api = useApi()
const localePath = useLocalePath()

const keyword = ref(String(route.query.q ?? ''))
const activeTab = ref('articles')
const result = ref<SearchResult>({ articles: [], users: [], totalArticles: 0, totalUsers: 0 })
const searching = ref(false)

async function runSearch() {
  const q = keyword.value.trim()
  if (!q) {
    result.value = { articles: [], users: [], totalArticles: 0, totalUsers: 0 }
    return
  }
  searching.value = true
  try {
    result.value = await api.get<SearchResult>('/search', { query: { q, limit: 30 } })
  } finally {
    searching.value = false
  }
}

watch(keyword, () => {
  if (!import.meta.client) return
  const url = new URL(window.location.href)
  url.searchParams.set('q', keyword.value)
  window.history.replaceState(null, '', url)
  runSearch()
})

onMounted(runSearch)

useHead({ title: `${t('search.result')} - DevShare` })
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <BaseInput v-model="keyword" :placeholder="t('search.placeholder')" class="mb-5" />

    <BaseTabs
      v-model="activeTab"
      :tabs="[
        { key: 'articles', label: `${t('search.articles')} (${result.totalArticles})` },
        { key: 'users', label: `${t('search.users')} (${result.totalUsers})` },
      ]"
      class="mb-4"
    />

    <div v-if="searching" class="flex flex-col gap-3">
      <BaseSkeleton v-for="i in 4" :key="i" class="h-28 rounded-xl" />
    </div>

    <template v-else-if="activeTab === 'articles'">
      <div v-if="result.articles.length > 0" class="flex flex-col gap-3">
        <ArticleCard v-for="article in result.articles" :key="article.id" :article="article" />
      </div>
      <BaseEmpty v-else :text="t('search.empty')" />
    </template>

    <template v-else>
      <div v-if="result.users.length > 0" class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <NuxtLink
          v-for="user in result.users"
          :key="user.id"
          :to="localePath(`/user/${user.id}`)"
          class="flex items-center gap-3 p-4 hover:bg-slate-50"
        >
          <BaseAvatar :src="user.avatar" :name="user.username" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-slate-400" />
              {{ user.username }}
            </p>
            <p class="text-xs text-slate-400 truncate">{{ user.bio ?? '' }}</p>
          </div>
        </NuxtLink>
      </div>
      <BaseEmpty v-else :text="t('search.empty')" />
    </template>
  </div>
</template>
