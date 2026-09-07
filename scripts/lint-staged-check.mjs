// pre-commit 里的“全项目兜底校验”，挂在 lint-staged 的 **/* 上。
//
// 为什么需要单独包装：lint-staged 会按模式把「匹配到的暂存文件路径」追加到命令尾部，
// 而 tsc / nuxt typecheck / jest / vitest 这类全项目检查不能接收文件参数，
// 直接写 "pnpm lint" 会被追加一长串文件名导致报错。这里忽略追加的文件参数，
// 保证每次提交（只要有暂存文件）只跑一遍与 CI 一致的全量 lint + test。
//
// 只做全量检查，不做文件级格式化/修错——文件级 prettier + eslint 由
// scripts/lint-staged-eslint.mjs 负责，本脚本排在它之后执行。
import { spawnSync } from 'node:child_process'

// lint-staged 以 git 根目录为 cwd
const root = process.cwd()

// 用 shell 执行 pnpm：git hook 环境里 pnpm 常由 corepack/全局安装，不在 node_modules 内，
// 需要 shell 的 PATH 才能解析到 pnpm(.cmd)。子进程 stdout/stderr 直接透传给终端。
function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: true })
  return r.status === 0
}

// 全量类型检查：shared/api 跑 tsc --noEmit，web 跑 nuxt typecheck（= CI 的 pnpm lint）
const lintOk = run('pnpm', ['lint'])
// 全量测试：shared 构建 + api jest + web vitest（= CI 的 pnpm test）；lint 失败则跳过
const testOk = lintOk ? run('pnpm', ['test']) : false

process.exit(lintOk && testOk ? 0 : 1)
