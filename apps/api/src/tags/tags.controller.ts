import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TagsService } from './tags.service'
import { CreateTagDto } from './dto/create-tag.dto'

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  @ApiOperation({ summary: '标签列表（含文章数）' })
  list() {
    return this.tags.list()
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建标签（仅管理员）' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTagDto) {
    return this.tags.create(user, dto)
  }
}
