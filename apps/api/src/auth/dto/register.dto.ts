import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'DevFan' })
  @IsString()
  @Matches(/^[\w\u4e00-\u9fa5]{3,30}$/, {
    message: '用户名只能包含中英文、数字、下划线，长度 3-30',
  })
  username: string

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(72, { message: '密码最长 72 位' })
  password: string
}
