import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import type { ArticleListItem, AuthorInfo, SearchResult } from '@devflow/shared'
import { ArticlesService } from '../articles/articles.service'
import { PrismaService } from '../prisma/prisma.service'
import { SearchService } from './search.service'

class SearchQueryDto {
  @IsString()
  q: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly articles: ArticlesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '搜索文章与用户' })
  async search(@Query() query: SearchQueryDto): Promise<SearchResult> {
    const q = query.q.trim()
    if (!q) return { articles: [], users: [], totalArticles: 0, totalUsers: 0 }

    const [articleRes, userRes] = await Promise.all([
      this.searchService.searchArticles(q, query.limit ?? 20),
      this.searchService.searchUsers(q, 10),
    ])
    const [articles, users] = await Promise.all([
      this.articles.getByIds(articleRes.ids),
      this.prisma.user.findMany({
        where: { id: { in: userRes.ids } },
        select: { id: true, username: true, avatar: true, bio: true },
      }),
    ])
    const userMap = new Map(userRes.ids.map((id, i) => [id, i]))
    const orderedUsers = users
      .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio }) as AuthorInfo)
      .sort((a, b) => (userMap.get(a.id) ?? 0) - (userMap.get(b.id) ?? 0))

    return {
      articles: articles as ArticleListItem[],
      users: orderedUsers,
      totalArticles: articleRes.total,
      totalUsers: userRes.total,
    }
  }
}
