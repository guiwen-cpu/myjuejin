<script setup lang="ts">
import { ChevronLeft, ChevronRight, Eye, MessageSquare } from 'lucide-vue-next'
import type { ArticleListItem } from '@devshare/shared'
import { formatCount, timeAgo } from '~/utils/format'
import { gradientForSeed, tagChipForSeed } from '~/utils/visual'
import { useNow } from '~/composables/useNow'

const props = defineProps<{ articles: ArticleListItem[] }>()
const { locale } = useI18n()
const localePath = useLocalePath()
const now = useNow()

const slides = computed(() => props.articles.slice(0, 4))
const current = ref(0)
const hovering = ref(false)
// 记录加载失败的封面 URL，失败后回退到渐变底，避免出现破图图标
const failedCovers = reactive(new Set<number>())
function onCoverError(articleId: number) {
  failedCovers.add(articleId)
}
let timer: ReturnType<typeof setInterval> | null = null

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function start() {
  stop()
  if (import.meta.client && slides.value.length > 1) {
    timer = setInterval(() => next(), 5000)
  }
}

function next() {
  if (slides.value.length < 2) return
  current.value = (current.value + 1) % slides.value.length
}

function prev() {
  if (slides.value.length < 2) return
  current.value = (current.value - 1 + slides.value.length) % slides.value.length
}

function go(index: number) {
  current.value = index
}

watch(
  () => slides.value.length,
  () => {
    if (current.value >= slides.value.length) current.value = 0
  },
)
watch(hovering, (h) => (h ? stop() : start()))
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section
    v-if="slides.length > 0"
    class="relative overflow-hidden rounded-2xl h-64 sm:h-72 shadow-md ring-1 ring-slate-900/5"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <!-- 滑动轨道：横向 translateX 切换，避免淡入淡出时前后两张文字短暂叠影 -->
    <div
      class="absolute inset-0 h-full transition-transform duration-500 ease-out"
      :style="{ transform: `translateX(-${current * 100}%)` }"
    >
      <div class="flex h-full">
        <div
          v-for="(article, i) in slides"
          :key="article.id"
          class="relative h-full w-full flex-none overflow-hidden"
          :class="gradientForSeed(article.id)"
          :aria-hidden="i !== current"
        >
          <!-- 有封面图时作为整张幻灯片的背景 -->
          <img
            v-if="article.cover && !failedCovers.has(article.id)"
            :src="article.cover"
            :alt="article.title"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover"
            @error="onCoverError(article.id)"
          />
          <!-- 深色遮罩叠在封面上层，保证白色文字可读 -->
          <div
            class="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/20"
          />
          <div
            class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <div class="relative h-full flex flex-col justify-center px-6 sm:px-12 py-8 max-w-[70%]">
            <div class="flex items-center gap-2 mb-3">
              <NuxtLink
                v-if="article.tags[0]"
                :to="localePath(`/tag/${article.tags[0].slug}`)"
                class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                :class="tagChipForSeed(article.tags[0].id)"
              >
                {{ article.tags[0].name }}
              </NuxtLink>
              <span class="text-xs text-white/80">
                {{ String(i + 1).padStart(2, '0') }} / {{ String(slides.length).padStart(2, '0') }}
              </span>
            </div>

            <NuxtLink
              :to="localePath(`/article/${article.id}`)"
              class="text-xl sm:text-2xl font-bold text-white leading-snug line-clamp-2 hover:underline decoration-white/60 underline-offset-4"
            >
              {{ article.title }}
            </NuxtLink>
            <p class="mt-2 hidden sm:block text-sm text-white/80 line-clamp-2">
              {{ article.summary ?? '' }}
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/85">
              <NuxtLink
                :to="localePath(`/user/${article.author.id}`)"
                class="flex items-center gap-1.5 hover:text-white min-w-0"
              >
                <BaseAvatar
                  :src="article.author.avatar"
                  :name="article.author.username"
                  size="xs"
                  class="ring-2 ring-white/30"
                />
                <span class="truncate max-w-32">{{ article.author.username }}</span>
              </NuxtLink>
              <span class="text-white/50" aria-hidden="true">·</span>
              <span class="flex items-center gap-1">
                <Eye class="w-3.5 h-3.5" /> {{ formatCount(article.viewCount) }}
              </span>
              <span class="text-white/50" aria-hidden="true">·</span>
              <span class="flex items-center gap-1">
                <MessageSquare class="w-3.5 h-3.5" /> {{ formatCount(article.commentCount) }}
              </span>
              <span class="text-white/50" aria-hidden="true">·</span>
              <time class="hidden sm:inline">{{ timeAgo(article.publishedAt, locale, now) }}</time>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 左右切换按钮 -->
    <button
      v-if="slides.length > 1"
      class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 grid place-items-center rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur transition-colors"
      aria-label="previous"
      @click="prev"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>
    <button
      v-if="slides.length > 1"
      class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 grid place-items-center rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur transition-colors"
      aria-label="next"
      @click="next"
    >
      <ChevronRight class="w-5 h-5" />
    </button>

    <!-- 底部指示点 -->
    <div v-if="slides.length > 1" class="absolute bottom-3 right-6 z-20 flex items-center gap-1.5">
      <button
        v-for="(_, i) in slides"
        :key="i"
        class="h-1.5 rounded-full transition-all"
        :class="i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'"
        :aria-label="`slide ${i + 1}`"
        @click="go(i)"
      />
    </div>
  </section>
</template>
