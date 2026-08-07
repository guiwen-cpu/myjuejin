import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查（Docker healthcheck 使用）' })
  async check() {
    let db = false
    let redis = false
    try {
      await this.prisma.$queryRaw`SELECT 1`
      db = true
    } catch {
      /* not healthy */
    }
    try {
      redis = this.redis.available
    } catch {
      /* not healthy */
    }
    return { status: db ? 'ok' : 'degraded', db, redis, uptime: process.uptime() }
  }
}
