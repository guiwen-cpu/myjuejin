import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import cron from 'node-cron'
import type { RankItem } from '@devshare/shared'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { ArticlesService } from '../articles/articles.service'

const RANK_CACHE_KEY = 'rank:hot:v1'
const HOT_TOP_N = 20

@Injectable()
export class RankService implements OnModuleInit {
  private readonly logger = new Logger(RankService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly articles: ArticlesService,
  ) {}

  onModuleInit() {
    cron.schedule('0 * * * *', () => {
      void this.recompute().catch((e) => this.logger.error(`Rank recompute failed: ${(e as Error).message}`))
    })
    this.logger.log('Hot-rank cron scheduled (hourly).')
  }

  async getTop(limit = HOT_TOP_N): Promise<RankItem[]> {
    const cached = await this.redis.getJson<number[]>(RANK_CACHE_KEY)
    if (cached && cached.length > 0) {
      const rows = await this.articles.getByIds(cached.slice(0, limit))
      return rows.map((article, i) => ({ rank: i + 1, article, score: 0 }))
    }
    const items = await this.computeTop(limit)
    await this.redis.set(RANK_CACHE_KEY, items.map((i) => i.article.id), 600)
    return items
  }

  async recompute(): Promise<void> {
    const articles = await this.prisma.article.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        publishedAt: true,
        viewCount: true,
        likeCount: true,
        collectCount: true,
        commentCount: true,
      },
    })
    const now = Date.now()
    const updates = articles.map((a) => {
      const ageHours = Math.max(0, (now - (a.publishedAt?.getTime() ?? now)) / 3_600_000)
      const base =
        Math.log(a.viewCount + 1) * 1 +
        Math.log(a.likeCount + 1) * 8 +
        Math.log(a.collectCount + 1) * 10 +
        Math.log(a.commentCount + 1) * 12
      const hotScore = base / Math.pow(ageHours + 2, 1.5)
      return this.prisma.article.update({
        where: { id: a.id },
        data: { hotScore },
        select: { id: true, hotScore: true },
      })
    })
    await Promise.all(updates)

    // 将 Redis 中的浏览计数落库并清零
    const viewKeys = await this.redis.keys('views:*')
    for (const key of viewKeys) {
      const articleId = Number(key.split(':')[1])
      if (!Number.isFinite(articleId)) continue
      const delta = Number(await this.redis.get(key)) || 0
      if (delta > 0) {
        await this.prisma.article.update({
          where: { id: articleId },
          data: { viewCount: { increment: delta } },
        })
        await this.redis.del(key)
      }
    }

    await this.redis.del(RANK_CACHE_KEY)
    this.logger.log(`Hot rank recomputed for ${articles.length} articles.`)
  }

  private async computeTop(limit: number): Promise<RankItem[]> {
    const rows = await this.prisma.article.findMany({
      where: { status: 'published' },
      orderBy: [{ hotScore: 'desc' }, { id: 'desc' }],
      take: limit,
      select: { id: true },
    })
    const list = await this.articles.getByIds(rows.map((r) => r.id))
    return list.map((article, i) => ({ rank: i + 1, article, score: 0 }))
  }
}
