import { Test } from '@nestjs/testing'
import { ArticlesService } from './articles.service'
import { renderMarkdown } from './markdown.util'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { SearchService } from '../search/search.service'

describe('markdown util', () => {
  it('渲染并净化 markdown（去掉原始 HTML）', () => {
    const html = renderMarkdown('# Hello\n\n<script>alert(1)</script>\n\n**bold**')
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).not.toContain('<script>')
  })
})

describe('ArticlesService', () => {
  let service: ArticlesService
  const prisma = {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    like: { count: jest.fn().mockResolvedValue(0) },
    collect: { count: jest.fn().mockResolvedValue(0) },
  }
  const redis = { incr: jest.fn().mockResolvedValue(1), mget: jest.fn().mockResolvedValue([]) }
  const search = { indexArticle: jest.fn(), removeArticle: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: SearchService, useValue: search },
      ],
    }).compile()
    service = moduleRef.get(ArticlesService)
  })

  it('创建文章时渲染并存储 HTML', async () => {
    prisma.article.create.mockResolvedValueOnce({
      id: 1,
      authorId: 1,
      title: 'T',
      summary: null,
      cover: null,
      contentMd: '# Hi',
      contentHtml: '<h1>Hi</h1>',
      status: 'draft',
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      hotScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      author: { id: 1, username: 'u', avatar: null, bio: null },
      tags: [],
    })
    prisma.article.findUnique.mockResolvedValueOnce({
      id: 1,
      authorId: 1,
      title: 'T',
      summary: null,
      cover: null,
      contentMd: '# Hi',
      contentHtml: '<h1>Hi</h1>',
      status: 'draft',
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      hotScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      author: { id: 1, username: 'u', avatar: null, bio: null },
      tags: [],
    })
    redis.incr.mockResolvedValueOnce(0)
    const user = { id: 1, email: 'a@b.com', username: 'u', role: 'user' }
    const result = await service.create(user, { title: 'T', contentMd: '# Hi' })
    expect(result.contentHtml).toBe('<h1>Hi</h1>')
    expect(result.status).toBe('draft')
  })
})
