// =====================================================================
// 端到端（E2E / 集成）测试 —— 测试"整个 NestJS 应用"能否正常响应请求
// ---------------------------------------------------------------------
// 和单元测试的区别：
//   - 单元测试：只测一个类/函数，数据库、Redis 全部用假对象（mock），
//     不启动应用，毫秒级跑完。
//   - 这里的 e2e 测试：真的创建整个应用、真的连数据库、真的发 HTTP 请求，
//     验证"路由 → 控制器 → 服务 → 数据库"整条链路是通的。
//
// 运行方式（需要 PostgreSQL 容器在跑、且已执行过 prisma migrate）：
//   pnpm --filter @devflow/api test:e2e
// =====================================================================

import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter'
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor'

// describe：把一组相关的测试用例包在一起（这里是"App (e2e)"整组）
describe('App (e2e)', () => {
  // 保存"测试用应用实例"的引用，beforeAll 里创建，每个用例共用
  let app: INestApplication

  // beforeAll：这一组测试开始前，只执行一次的准备动作
  // （对比：beforeEach 是每个用例前都执行）
  beforeAll(async () => {
    // 1. 用真实的 AppModule 组装一个 Nest 模块。
    //    注意：这不会真的监听一个端口（比如 3001），
    //    只是把整个依赖树（控制器/服务/Prisma/Redis）构建出来。
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

    // 2. 从模块创建出"应用对象"（此时还没初始化）
    app = moduleRef.createNestApplication()

    // 3. 关键！测试里创建的应用默认是"裸的"，
    //    而真实启动时（src/main.ts）会做这些全局配置。
    //    如果不在这里补上，路由就会少了 /api/v1 前缀，请求全部 404
    //    （这个坑我们之前踩过：/health 能通、/api/v1/health 404）。
    //    所以这里要和 main.ts 保持一模一样：

    // 全局路由前缀：所有接口都挂在 /api/v1 下面
    app.setGlobalPrefix('api/v1')

    // 全局校验管道：自动校验请求参数（DTO 上的 class-validator 规则）
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // 去掉 DTO 里没声明多余的字段
        transform: true, // 把请求参数转换成 DTO 类型（字符串→数字等）
        transformOptions: { enableImplicitConversion: true },
      }),
    )

    // 全局异常过滤器：统一把错误转成 { statusCode, code, message } 格式
    app.useGlobalFilters(new HttpExceptionFilter())

    // 全局响应拦截器：统一把成功响应包成 { data: ... }
    app.useGlobalInterceptors(new TransformInterceptor())

    // 4. 初始化应用：此时 Prisma 会真正连接数据库等
    await app.init()
  })

  // afterAll：这一组测试全部结束后，只执行一次的清理动作
  afterAll(async () => {
    // 关闭应用：断开数据库连接、释放资源
    await app.close()
  })

  // it：一个具体的测试用例
  // supertest 的 request(app.getHttpServer())：
  //   不发真实网络请求、不占端口，直接在进程内把 HTTP 请求打进应用，
  //   对应用来说和真实请求完全一样。
  it('/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200)
    // 因为全局拦截器把响应包成了 { data: ... }，
    // 所以健康检查的结果在 res.body.data 里
    expect(res.body.data.status).toBeDefined()
  })

  it('/api/v1/tags returns list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/tags').expect(200)
    // 标签接口应返回一个数组（可能为空数组，但必须是数组）
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

// 小贴士：
// - 这个文件由 apps/api/package.json 里的 "test:e2e" 脚本运行：
//   jest --config ./test/jest-e2e.json --forceExit
// - --forceExit：测试结束后强制退出进程（否则数据库/Redis 连接会让
//   Jest 一直挂着不退出）。
// - 想加更多 e2e 用例？照着 it(...) 的样子加就行，
//   比如注册→登录→发文章→评论 的完整用户流程。
