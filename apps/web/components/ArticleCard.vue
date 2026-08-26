<script setup lang="ts">
import { Eye, Heart, MessageSquare, Star } from 'lucide-vue-next'
import type { ArticleListItem } from '@devshare/shared'
import { formatCount, timeAgo } from '~/utils/format'

const props = defineProps<{ article: ArticleListItem }>()
const { locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <article class="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-4 h-36 flex gap-4 overflow-hidden">
    <div class="flex-1 min-w-0 flex flex-col">
      <NuxtLink
        :to="localePath(`/article/${props.article.id}`)"
        class="text-base font-semibold text-slate-900 hover:text-brand-600 leading-snug line-clamp-2"
      >
        {{ props.article.title }}
      </NuxtLink>
      <p class="text-sm text-slate-500 mt-1 line-clamp-1">
        {{ props.article.summary ?? '' }}
      </p>
      <div class="mt-auto flex items-center gap-3 text-xs text-slate-400">
        <NuxtLink
          :to="localePath(`/user/${props.article.author.id}`)"
          class="flex items-center gap-1.5 hover:text-brand-600 min-w-0"
        >
          <BaseAvatar :src="props.article.author.avatar" :name="props.article.author.username" size="xs" />
          <span class="truncate">{{ props.article.author.username }}</span>
        </NuxtLink>
        <span class="flex items-center gap-1">
          <Eye class="w-3.5 h-3.5" /> {{ formatCount(props.article.viewCount) }}
        </span>
        <span class="flex items-center gap-1">
          <Heart class="w-3.5 h-3.5" /> {{ formatCount(props.article.likeCount) }}
        </span>
        <span class="flex items-center gap-1">
          <MessageSquare class="w-3.5 h-3.5" /> {{ formatCount(props.article.commentCount) }}
        </span>
        <span class="hidden sm:inline">{{ timeAgo(props.article.publishedAt, locale) }}</span>
      </div>
    </div>
    <div v-if="props.article.cover" class="w-36 shrink-0">
      <img
        :src="props.article.cover"
        :alt="props.article.title"
        loading="lazy"
        class="w-full h-24 object-cover rounded-lg"
      />
    </div>
  </article>
</template>
