import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCodes, type TagDTO } from '@devshare/shared'
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTagDto } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type TagWithCount = Prisma.TagGetPayload<{ include: { _count: { select: { articles: true } } } }>

function toDto(tag: TagWithCount): TagDTO {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    articleCount: tag._count.articles,
  }
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TagDTO[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    })
    return tags.map(toDto)
  }

  async create(user: AuthenticatedUser, dto: CreateTagDto): Promise<TagDTO> {
    this.assertAdmin(user)

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
      this.rethrowConflict(error)
    }
  }

  async update(user: AuthenticatedUser, id: number, dto: UpdateTagDto): Promise<TagDTO> {
    this.assertAdmin(user)

    const existing = await this.prisma.tag.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCodes.TAG_NOT_FOUND,
        message: 'Tag not found',
      })
    }

    try {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
        },
        include: { _count: { select: { articles: true } } },
      })
      return toDto(tag)
    } catch (error) {
      this.rethrowConflict(error)
    }
  }

  async remove(user: AuthenticatedUser, id: number): Promise<{ success: boolean }> {
    this.assertAdmin(user)

    const existing = await this.prisma.tag.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCodes.TAG_NOT_FOUND,
        message: 'Tag not found',
      })
    }

    await this.prisma.tag.delete({ where: { id } })
    return { success: true }
  }

  private assertAdmin(user: AuthenticatedUser): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Only admins can manage tags',
      })
    }
  }

  private rethrowConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'Tag with this name or slug already exists',
      })
    }
    throw error
  }
}
