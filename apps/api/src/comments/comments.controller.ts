import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator'
import { CursorPageDto } from '../common/dto/cursor-page.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateCommentDto } from './dto/create-comment.dto'
import { CommentsService } from './comments.service'

@ApiTags('comments')
@Controller('articles/:articleId/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @ApiOperation({ summary: '文章评论列表（cursor 分页）' })
  async list(@Param('articleId', ParseIntPipe) articleId: number, @Query() query: CursorPageDto) {
    return this.comments.list(articleId, query.cursor, query.limit)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评论/回复' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user, articleId, dto)
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论（作者/文章作者/admin）' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.comments.remove(user, commentId)
  }
}
