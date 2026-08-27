import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { ErrorCodes, type AuthResult, type UserProfile } from '@devshare/shared'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { toUserProfile } from '../users/user.mapper'

export const REFRESH_COOKIE = 'df_refresh'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult & { refreshToken: string }> {
    const [emailTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ])
    if (emailTaken) throw new ConflictException({ code: ErrorCodes.EMAIL_TAKEN, message: '该邮箱已被注册' })
    if (usernameTaken)
      throw new ConflictException({ code: ErrorCodes.USERNAME_TAKEN, message: '该用户名已被占用' })

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, username: dto.username, passwordHash },
    })
    return this.buildAuthResult(user)
  }

  async login(dto: LoginDto): Promise<AuthResult & { refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException({ code: ErrorCodes.INVALID_CREDENTIALS, message: '邮箱或密码错误' })
    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) throw new UnauthorizedException({ code: ErrorCodes.INVALID_CREDENTIALS, message: '邮箱或密码错误' })
    return this.buildAuthResult(user)
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult & { refreshToken: string }> {
    if (!refreshToken) throw new UnauthorizedException({ code: ErrorCodes.INVALID_REFRESH_TOKEN, message: '未登录' })
    const rawUserId = await this.redis.get(`refresh:${refreshToken}`)
    if (!rawUserId) throw new UnauthorizedException({ code: ErrorCodes.INVALID_REFRESH_TOKEN, message: '登录已过期' })
    const user = await this.prisma.user.findUnique({ where: { id: Number(rawUserId) } })
    if (!user) throw new UnauthorizedException({ code: ErrorCodes.INVALID_REFRESH_TOKEN, message: '用户不存在' })
    await this.redis.del(`refresh:${refreshToken}`)
    return this.buildAuthResult(user)
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.redis.del(`refresh:${refreshToken}`)
  }

  async findById(id: number): Promise<UserProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })
    return toUserProfile(user)
  }

  private async buildAuthResult(user: {
    id: number
    email: string
    username: string
    role: string
    avatar: string | null
    bio: string | null
    locale: string
    createdAt: Date
  }): Promise<AuthResult & { refreshToken: string }> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, username: user.username, role: user.role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'devshare-access-secret-change-me',
        expiresIn: Number(this.config.get<string>('ACCESS_TOKEN_TTL_SECONDS') ?? 1800),
      },
    )
    const refreshToken = randomBytes(48).toString('hex')
    const ttl = Number(this.config.get<string>('REFRESH_TOKEN_TTL_SECONDS') ?? 604800)
    await this.redis.set(`refresh:${refreshToken}`, user.id, ttl)

    const profile = await toUserProfile(user)
    return { accessToken, refreshToken, user: { ...profile, email: user.email } }
  }
}
