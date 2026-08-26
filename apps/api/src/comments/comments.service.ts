import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Comment } from '@prisma/client'
import { ErrorCodes, type CommentItem, type Paginated } from '@devshare/shared'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator'

const commentInclude = {
  author: { select: { id: true, username: true, avatar: true, bio: true } },
} as const

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(articleId: number, cursor?: string, limit = 20): Promise<Paginated<CommentItem>> {
    const size = Math.min(limit, 50)
    const rows = await this.prisma.comment.findMany({
      where: {
        articleId,
        ...(cursor ? { id: { lt: Number(cursor) } } : {}),
      },
      orderBy: { id: 'desc' },
      take: size + 1,
      include: commentInclude,
    })
    const hasMore = rows.length > size
    const page = hasMore ? rows.slice(0, size) : rows
    const replyCounts = await this.replyCountMap(page.map((c) => c.id))
    const items = page.map((c) => this.toItem(c, replyCounts.get(c.id) ?? 0))
    const last = page[page.length - 1]
    return { items, nextCursor: hasMore && last ? String(last.id) : null }
  }

  async create(user: AuthenticatedUser, articleId: number, dto: {
    content: string
    parentId?: number
  }): Promise<CommentItem> {
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } })
      if (!parent) throw new NotFoundException({ code: ErrorCodes.COMMENT_NOT_FOUND, message: '回复的评论不存在' })
      if (parent.articleId !== articleId) {
        throw new BadRequestException({ code: ErrorCodes.VALIDATION_FAILED, message: '回复的评论不属于该文章' })
      }
    }
    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          articleId,
          authorId: user.id,
          content: dto.content,
          parentId: dto.parentId,
        },
        include: commentInclude,
      })
      await tx.article.update({
        where: { id: articleId },
        data: { commentCount: { increment: 1 } },
      })
      return created
    })
    return this.toItem(comment, 0)
  }

  async remove(user: AuthenticatedUser, commentId: number): Promise<{ success: boolean }> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) throw new NotFoundException({ code: ErrorCodes.COMMENT_NOT_FOUND, message: '评论不存在' })
    const article = await this.prisma.article.findUnique({ where: { id: comment.articleId } })
    if (comment.authorId !== user.id && user.role !== 'admin' && article?.authorId !== user.id) {
      throw new ForbiddenException({ code: ErrorCodes.FORBIDDEN, message: '无权删除该评论' })
    }
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.article.update({
        where: { id: comment.articleId },
        data: { commentCount: { decrement: 1 } },
      }),
    ])
    return { success: true }
  }

  private async replyCountMap(commentIds: number[]): Promise<Map<number, number>> {
    if (commentIds.length === 0) return new Map()
    const groups = await this.prisma.comment.groupBy({
      by: ['parentId'],
      where: { parentId: { in: commentIds } },
      _count: { _all: true },
    })
    return new Map(groups.map((g) => [g.parentId as number, g._count._all]))
  }

  private toItem(comment: Comment & { author: { id: number; username: string; avatar: string | null; bio: string | null } }, replyCount: number): CommentItem {
    return {
      id: comment.id,
      articleId: comment.articleId,
      author: comment.author,
      content: comment.content,
      parentId: comment.parentId,
      replyCount,
      createdAt: comment.createdAt.toISOString(),
    }
  }
}
