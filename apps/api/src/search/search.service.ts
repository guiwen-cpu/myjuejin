import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MeiliSearch } from 'meilisearch'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name)
  private client: MeiliSearch | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const host = this.config.get<string>('MEILI_HOST')
    const apiKey = this.config.get<string>('MEILI_MASTER_KEY')
    if (!host) {
      this.logger.warn('MEILI_HOST not set, search falls back to PostgreSQL LIKE.')
      return
    }
    try {
      this.client = new MeiliSearch({ host, apiKey: apiKey ?? '' })
      const articles = this.client.index('articles')
      await articles.updateSettings({
        searchableAttributes: ['title', 'summary', 'tagSlugs', 'authorUsername'],
        filterableAttributes: ['tagSlugs', 'status'],
        sortableAttributes: ['publishedAt'],
      })
      await this.client.index('users').updateSettings({
        searchableAttributes: ['username', 'bio'],
      })
      this.logger.log('Meilisearch connected and indexes configured.')
    } catch (e) {
      this.logger.warn(`Meilisearch init failed: ${(e as Error).message}`)
      this.client = null
    }
  }

  get available(): boolean {
    return this.client !== null
  }

  async indexArticle(articleId: number): Promise<void> {
    if (!this.client) return
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: { select: { username: true } },
        tags: { include: { tag: { select: { slug: true } } } },
      },
    })
    if (!article || article.status !== 'published') return
    await this.client.index('articles').addDocuments([
      {
        id: article.id,
        title: article.title,
        summary: article.summary ?? '',
        tagSlugs: article.tags.map((t) => t.tag.slug),
        authorUsername: article.author.username,
        status: 'published',
        publishedAt: article.publishedAt?.getTime() ?? article.createdAt.getTime(),
      },
    ])
  }

  async removeArticle(articleId: number): Promise<void> {
    if (!this.client) return
    await this.client.index('articles').deleteDocument(articleId)
  }

  async indexUser(userId: number): Promise<void> {
    if (!this.client) return
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return
    await this.client.index('users').addDocuments([
      { id: user.id, username: user.username, bio: user.bio ?? '' },
    ])
  }

  async searchArticles(q: string, limit = 20): Promise<{ ids: number[]; total: number }> {
    if (this.client) {
      try {
        const result = await this.client.index('articles').search(q, { limit, filter: ['status = published'] })
        const ids = result.hits.map((h) => Number((h as { id: number }).id))
        return { ids, total: result.estimatedTotalHits ?? ids.length }
      } catch (e) {
        this.logger.warn(`Meilisearch search failed, fallback: ${(e as Error).message}`)
      }
    }
    // 兜底：PostgreSQL LIKE
    const rows = await this.prisma.article.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true },
    })
    return { ids: rows.map((r) => r.id), total: rows.length }
  }

  async searchUsers(q: string, limit = 10): Promise<{ ids: number[]; total: number }> {
    if (this.client) {
      try {
        const result = await this.client.index('users').search(q, { limit })
        const ids = result.hits.map((h) => Number((h as { id: number }).id))
        return { ids, total: result.estimatedTotalHits ?? ids.length }
      } catch (e) {
        this.logger.warn(`Meilisearch user search failed, fallback: ${(e as Error).message}`)
      }
    }
    const rows = await this.prisma.user.findMany({
      where: { OR: [{ username: { contains: q } }, { bio: { contains: q } }] },
      take: limit,
      select: { id: true },
    })
    return { ids: rows.map((r) => r.id), total: rows.length }
  }
}
