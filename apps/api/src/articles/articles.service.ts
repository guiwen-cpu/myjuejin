import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import {
  ErrorCodes,
  type ArticleDetail,
  type ArticleInput,
  type ArticleListItem,
  type Paginated,
  type SortOrder,
} from '@devflow/shared'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator'
import { renderMarkdown } from './markdown.util'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { SearchService } from '../search/search.service'

const authorSelect = { id: true, username: true, avatar: true, bio: true } as const
const articleInclude = {
  author: { select: authorSelect },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude

function encodeCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeCursor(cursor?: string): Record<string, unknown> | null {
  if (!cursor) return null
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString()) as Record<string, unknown>
  } catch {
    return null
  }
}

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly search: SearchService,
  ) {}

  async feed(
    opts: { sort?: SortOrder; tag?: string; cursor?: string; limit?: number; viewerId?: number },
  ): Promise<Paginated<ArticleListItem>> {
    const limit = Math.min(opts.limit ?? 20, 50)
    const where: Prisma.ArticleWhereInput = { status: 'published' }
    if (opts.tag) where.tags = { some: { tag: { slug: opts.tag } } }

    let orderBy: Prisma.ArticleOrderByWithRelationInput[]
    let cursorWhere: Prisma.ArticleWhereInput | undefined

    if (opts.sort === 'hot') {
      orderBy = [{ hotScore: 'desc' }, { id: 'desc' }]
      const c = decodeCursor(opts.cursor)
      if (c && typeof c.s === 'number' && typeof c.id === 'number') {
        cursorWhere = {
          OR: [
            { hotScore: { lt: c.s } },
            { hotScore: c.s, id: { lt: c.id } },
          ],
        }
      }
    } else {
      orderBy = [{ publishedAt: 'desc' }, { id: 'desc' }]
      const c = decodeCursor(opts.cursor)
      if (c && typeof c.p === 'string' && typeof c.id === 'number') {
        cursorWhere = {
          OR: [
            { publishedAt: { lt: new Date(c.p) } },
            { publishedAt: new Date(c.p), id: { lt: c.id } },
          ],
        }
      }
    }

    const rows = await this.prisma.article.findMany({
      where: { ...where, ...(cursorWhere ?? {}) },
      orderBy,
      take: limit + 1,
      include: articleInclude,
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const items = await this.toListItemList(page)
    const last = page[page.length - 1]
    let nextCursor: string | null = null
    if (hasMore && last) {
      nextCursor =
        opts.sort === 'hot'
          ? encodeCursor({ s: last.hotScore, id: last.id })
          : encodeCursor({ p: last.publishedAt?.toISOString(), id: last.id })
    }
    return { items, nextCursor }
  }

  async detail(id: number, viewer?: AuthenticatedUser): Promise<ArticleDetail> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    })
    const canViewDraft =
      viewer && article && (article.authorId === viewer.id || viewer.role === 'admin')
    if (!article || (article.status !== 'published' && !canViewDraft)) {
      throw new NotFoundException({ code: ErrorCodes.ARTICLE_NOT_FOUND, message: '文章不存在' })
    }

    const viewDelta = await this.redis.incr(`views:${id}`)
    const [likedByMe, collectedByMe] = viewer
      ? await Promise.all([
          this.prisma.like.count({ where: { userId: viewer.id, articleId: id } }),
          this.prisma.collect.count({ where: { userId: viewer.id, articleId: id } }),
        ])
      : [0, 0]

    return this.toDetail(article, viewDelta, likedByMe > 0, collectedByMe > 0)
  }

  async create(user: AuthenticatedUser, dto: CreateArticleDto): Promise<ArticleDetail> {
    const published = dto.publish === true
    const article = await this.prisma.article.create({
      data: {
        authorId: user.id,
        title: dto.title,
        summary: dto.summary,
        cover: dto.cover,
        contentMd: dto.contentMd,
        contentHtml: renderMarkdown(dto.contentMd),
        status: published ? 'published' : 'draft',
        publishedAt: published ? new Date() : null,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: articleInclude,
    })
    if (published) await this.search.indexArticle(article.id)
    const [likedByMe, collectedByMe] = await Promise.all([
      this.prisma.like.count({ where: { userId: user.id, articleId: article.id } }),
      this.prisma.collect.count({ where: { userId: user.id, articleId: article.id } }),
    ])
    return this.toDetail(article, 0, likedByMe > 0, collectedByMe > 0)
  }

  async update(user: AuthenticatedUser, id: number, dto: UpdateArticleDto): Promise<ArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException({ code: ErrorCodes.ARTICLE_NOT_FOUND, message: '文章不存在' })
    if (existing.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException({ code: ErrorCodes.FORBIDDEN, message: '只能编辑自己的文章' })
    }

    const wasDraft = existing.status === 'draft'
    const publishNow = dto.publish === true
    const article = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title,
        summary: dto.summary,
        cover: dto.cover,
        contentMd: dto.contentMd,
        contentHtml: dto.contentMd ? renderMarkdown(dto.contentMd) : undefined,
        status: publishNow && wasDraft ? 'published' : undefined,
        publishedAt: publishNow && wasDraft ? new Date() : undefined,
        tags: dto.tagIds
          ? {
              deleteMany: {},
              create: dto.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: articleInclude,
    })
    if (article.status === 'published') await this.search.indexArticle(article.id)
    const [likedByMe, collectedByMe] = await Promise.all([
      this.prisma.like.count({ where: { userId: user.id, articleId: article.id } }),
      this.prisma.collect.count({ where: { userId: user.id, articleId: article.id } }),
    ])
    return this.toDetail(article, 0, likedByMe > 0, collectedByMe > 0)
  }

  async remove(user: AuthenticatedUser, id: number): Promise<{ success: boolean }> {
    const existing = await this.prisma.article.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException({ code: ErrorCodes.ARTICLE_NOT_FOUND, message: '文章不存在' })
    if (existing.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException({ code: ErrorCodes.FORBIDDEN, message: '只能删除自己的文章' })
    }
    await this.prisma.article.delete({ where: { id } })
    await this.search.removeArticle(id)
    return { success: true }
  }

  async toggleLike(userId: number, articleId: number): Promise<{ liked: boolean; likeCount: number }> {
    const article = await this.ensureExists(articleId)
    const existing = await this.prisma.like.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { userId_articleId: { userId, articleId } } }),
        this.prisma.article.update({
          where: { id: articleId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return { liked: false, likeCount: Math.max(0, article.likeCount - 1) }
    }
    await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, articleId } }),
      this.prisma.article.update({
        where: { id: articleId },
        data: { likeCount: { increment: 1 } },
      }),
    ])
    return { liked: true, likeCount: article.likeCount + 1 }
  }

  async toggleCollect(
    userId: number,
    articleId: number,
  ): Promise<{ collected: boolean; collectCount: number }> {
    const article = await this.ensureExists(articleId)
    const existing = await this.prisma.collect.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.collect.delete({ where: { userId_articleId: { userId, articleId } } }),
        this.prisma.article.update({
          where: { id: articleId },
          data: { collectCount: { decrement: 1 } },
        }),
      ])
      return { collected: false, collectCount: Math.max(0, article.collectCount - 1) }
    }
    await this.prisma.$transaction([
      this.prisma.collect.create({ data: { userId, articleId } }),
      this.prisma.article.update({
        where: { id: articleId },
        data: { collectCount: { increment: 1 } },
      }),
    ])
    return { collected: true, collectCount: article.collectCount + 1 }
  }

  async getArticleById(id: number): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({ where: { id }, include: articleInclude })
  }

  async getByIds(ids: number[]): Promise<ArticleListItem[]> {
    if (ids.length === 0) return []
    const rows = await this.prisma.article.findMany({
      where: { id: { in: ids }, status: 'published' },
      include: articleInclude,
    })
    const map = new Map(rows.map((r) => [r.id, r]))
    return this.toListItemList(ids.map((id) => map.get(id)).filter((r): r is ArticleWithRelations => Boolean(r)))
  }

  private async ensureExists(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException({ code: ErrorCodes.ARTICLE_NOT_FOUND, message: '文章不存在' })
    return article
  }

  private async toListItemList(rows: ArticleWithRelations[]): Promise<ArticleListItem[]> {
    const deltas = await this.redis.mget(rows.map((r) => `views:${r.id}`))
    return rows.map((row, i) => this.toListItem(row, Number(deltas[i] ?? 0)))
  }

  private toListItem(row: ArticleWithRelations, viewDelta = 0): ArticleListItem {
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      cover: row.cover,
      author: row.author,
      tags: row.tags.map((t) => t.tag),
      viewCount: row.viewCount + viewDelta,
      likeCount: row.likeCount,
      collectCount: row.collectCount,
      commentCount: row.commentCount,
      status: row.status as ArticleListItem['status'],
      publishedAt: row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
    }
  }

  private toDetail(
    row: ArticleWithRelations,
    viewDelta: number,
    likedByMe: boolean,
    collectedByMe: boolean,
  ): ArticleDetail {
    return {
      ...this.toListItem(row, viewDelta),
      contentMd: row.contentMd,
      contentHtml: row.contentHtml,
      likedByMe,
      collectedByMe,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
