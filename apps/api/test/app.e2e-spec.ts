import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('App (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200)
    expect(res.body.data.status).toBeDefined()
  })

  it('/api/v1/tags returns list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/tags').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
