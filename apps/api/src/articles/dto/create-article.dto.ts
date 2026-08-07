import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  IsInt,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateArticleDto {
  @ApiProperty({ example: 'Vue 3 组合式 API 实战' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string

  @ApiPropertyOptional({ example: '文章摘要' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.png' })
  @IsOptional()
  @IsUrl()
  cover?: string

  @ApiProperty({ example: '# 标题\n\n正文内容' })
  @IsString()
  @MinLength(1)
  contentMd: string

  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  tagIds?: number[]

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  publish?: boolean
}
