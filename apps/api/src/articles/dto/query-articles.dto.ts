import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { CursorPageDto } from '../../common/dto/cursor-page.dto'

export class QueryArticlesDto extends CursorPageDto {
  @ApiPropertyOptional({ enum: ['latest', 'hot'], default: 'latest' })
  @IsOptional()
  @IsEnum(['latest', 'hot'])
  sort?: 'latest' | 'hot' = 'latest'

  @ApiPropertyOptional({ example: 'vue' })
  @IsOptional()
  @IsString()
  tag?: string
}
