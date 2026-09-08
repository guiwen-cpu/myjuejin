<script setup lang="ts">
import type { TagDTO } from '@devshare/shared'
import { tagChipForSeed } from '~/utils/visual'

const props = defineProps<{ tags: TagDTO[]; max?: number }>()
const localePath = useLocalePath()

// 按文章数降序取前 max 个，数量多的字号略大，形成「标签云」视觉层次
const cloud = computed(() =>
  [...props.tags]
    .sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
    .slice(0, props.max ?? 18),
)
</script>

<template>
  <div v-if="cloud.length > 0" class="flex flex-wrap gap-2">
    <NuxtLink
      v-for="(tag, index) in cloud"
      :key="tag.id"
      :to="localePath(`/tag/${tag.slug}`)"
      class="inline-flex items-center rounded-md font-medium transition-colors"
      :class="[
        tagChipForSeed(tag.id),
        index < 3 ? 'text-[13px] px-2.5 py-1' : 'text-xs px-2 py-0.5',
      ]"
    >
      {{ tag.name }}
    </NuxtLink>
  </div>
  <p v-else class="text-sm text-slate-400 py-4 text-center">{{ $t('home.empty') }}</p>
</template>
