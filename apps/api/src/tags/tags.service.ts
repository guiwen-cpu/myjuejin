import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCodes, type TagDTO } from '@devshare/shared'
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTagDto } from './dto/create-tag.dto'

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TagDTO[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    })
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      articleCount: t._count.articles,
    }))
  }

  async create(user: AuthenticatedUser, dto: CreateTagDto): Promise<TagDTO> {
    if (user.role !== 'admin') {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Only admins can manage tags',
      })
    }

    const name = dto.name.trim()
    const slug = dto.slug?.trim() || slugify(name)
    if (!slug) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'slug is required when name cannot be converted to an ASCII slug',
      })
    }

    try {
      const tag = await this.prisma.tag.create({
        data: { name, slug },
      })
      return { id: tag.id, name: tag.name, slug: tag.slug, articleCount: 0 }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: ErrorCodes.CONFLICT,
          message: 'Tag with this name or slug already exists',
        })
      }
      throw error
    }
  }
}
