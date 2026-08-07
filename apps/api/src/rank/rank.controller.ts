import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { RankService } from './rank.service'

class RankQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}

@ApiTags('rank')
@Controller('rank')
export class RankController {
  constructor(private readonly rank: RankService) {}

  @Get('hot')
  @ApiOperation({ summary: '热门榜（时间衰减 + 互动加权，Redis 缓存）' })
  hot(@Query() query: RankQueryDto) {
    return this.rank.getTop(query.limit)
  }
}
