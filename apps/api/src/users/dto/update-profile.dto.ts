import { IsLocale, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'DevFan' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string

  @ApiPropertyOptional({ example: '前端工程师，热爱开源' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatar?: string

  @ApiPropertyOptional({ example: 'zh', enum: ['zh', 'en'] })
  @IsOptional()
  @IsLocale()
  locale?: string
}
