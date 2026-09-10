import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { TagsService } from './tags.service'

describe('TagsService', () => {
  let service: TagsService
  const prisma = {
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile()
    service = moduleRef.get(TagsService)
  })

  const admin = { id: 1, email: 'admin@devshare.dev', username: 'admin', role: 'admin' }
  const user = { id: 2, email: 'user@devshare.dev', username: 'user', role: 'user' }

  it('lists tags with article counts', async () => {
    prisma.tag.findMany.mockResolvedValueOnce([
      { id: 1, name: 'Vue', slug: 'vue', _count: { articles: 3 } },
    ])

    const result = await service.list()

    expect(result).toEqual([{ id: 1, name: 'Vue', slug: 'vue', articleCount: 3 }])
  })

  it('rejects non-admin users on create', async () => {
    await expect(service.create(user, { name: 'Vue' })).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.tag.create).not.toHaveBeenCalled()
  })

  it('creates a tag with an explicit slug', async () => {
    prisma.tag.create.mockResolvedValueOnce({
      id: 5,
      name: 'TypeScript',
      slug: 'typescript',
    })

    const result = await service.create(admin, { name: 'TypeScript', slug: 'typescript' })

    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { name: 'TypeScript', slug: 'typescript' },
    })
    expect(result).toEqual({ id: 5, name: 'TypeScript', slug: 'typescript', articleCount: 0 })
  })

  it('derives an ASCII slug from the name when omitted', async () => {
    prisma.tag.create.mockResolvedValueOnce({ id: 6, name: 'Cloud Native', slug: 'cloud-native' })

    await service.create(admin, { name: 'Cloud Native' })

    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { name: 'Cloud Native', slug: 'cloud-native' },
    })
  })

  it('throws ConflictException on a duplicate name/slug', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    })
    prisma.tag.create.mockRejectedValueOnce(conflict)

    await expect(service.create(admin, { name: 'Vue', slug: 'vue' })).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it('rejects non-admin users on update', async () => {
    await expect(service.update(user, 1, { name: 'Vue' })).rejects.toBeInstanceOf(
      ForbiddenException,
    )
    expect(prisma.tag.update).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when updating a missing tag', async () => {
    prisma.tag.findUnique.mockResolvedValueOnce(null)

    await expect(service.update(admin, 999, { name: 'Vue' })).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('updates a tag and returns its article count', async () => {
    prisma.tag.findUnique.mockResolvedValueOnce({ id: 1, name: 'Vue', slug: 'vue' })
    prisma.tag.update.mockResolvedValueOnce({
      id: 1,
      name: 'Vue 3',
      slug: 'vue',
      _count: { articles: 4 },
    })

    const result = await service.update(admin, 1, { name: 'Vue 3' })

    expect(prisma.tag.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Vue 3' },
      include: { _count: { select: { articles: true } } },
    })
    expect(result).toEqual({ id: 1, name: 'Vue 3', slug: 'vue', articleCount: 4 })
  })

  it('rejects non-admin users on remove', async () => {
    await expect(service.remove(user, 1)).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.tag.delete).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when removing a missing tag', async () => {
    prisma.tag.findUnique.mockResolvedValueOnce(null)

    await expect(service.remove(admin, 999)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('removes a tag', async () => {
    prisma.tag.findUnique.mockResolvedValueOnce({ id: 1, name: 'Vue', slug: 'vue' })
    prisma.tag.delete.mockResolvedValueOnce({ id: 1 })

    const result = await service.remove(admin, 1)

    expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(result).toEqual({ success: true })
  })
})
