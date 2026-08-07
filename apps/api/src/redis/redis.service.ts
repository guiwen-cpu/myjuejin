import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | null = null

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL')
    if (!url) {
      this.logger.warn('REDIS_URL not set, Redis features disabled (cache/counters fall back to DB).')
      return
    }
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 })
    await this.client.connect().catch(() => this.logger.warn('Redis connection failed, continuing without cache.'))
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined)
  }

  get available(): boolean {
    return this.client?.status === 'ready'
  }

  private guard(): Redis {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis unavailable')
    }
    return this.client
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) return null
    return this.guard().get(key)
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: string | number | object, ttlSeconds?: number): Promise<void> {
    if (!this.available) return
    const raw = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (ttlSeconds) await this.guard().set(key, raw, 'EX', ttlSeconds)
    else await this.guard().set(key, raw)
  }

  async del(key: string): Promise<void> {
    if (!this.available) return
    await this.guard().del(key)
  }

  async incr(key: string): Promise<number> {
    if (!this.available) return 0
    return this.guard().incr(key)
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.available || keys.length === 0) return keys.map(() => null)
    return this.guard().mget(keys)
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.available) return []
    return this.guard().keys(pattern)
  }
}
