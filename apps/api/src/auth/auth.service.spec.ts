import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

describe('AuthService', () => {
  let service: AuthService
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  }
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: jest.fn((k: string) => (k === 'JWT_ACCESS_SECRET' ? 'secret' : undefined)) } },
      ],
    }).compile()
    service = moduleRef.get(AuthService)
  })

  it('注册时邮箱重复抛出 ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'a@b.com' })
    await expect(
      service.register({ username: 'devfan', email: 'a@b.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('登录密码错误抛出 UnauthorizedException', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'a@b.com',
      passwordHash: '$2a$10$invalid',
    })
    await expect(
      service.login({ email: 'a@b.com', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
