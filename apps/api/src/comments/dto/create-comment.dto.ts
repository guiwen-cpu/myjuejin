import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCommentDto {
  @ApiProperty({ example: '写得很棒！' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number
}
