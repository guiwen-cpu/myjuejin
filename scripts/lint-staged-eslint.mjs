// pre-commit 阶段按文件所属包运行 ESLint 的脚本。
// 原因：Nuxt 生成的 ESLint 配置必须在 apps/web 目录下才能正确解析 .vue，
//       而 lint-staged 默认在 git 根目录执行，会导致 .vue 被当成普通 JS 解析报错。
// 因此这里按目录分组：web 在 apps/web 跑、api 在 apps/api 跑、其余暂不强制。
import { spawnSync } from 'node:child_process'
import path from 'node:path'

// git 根目录（lint-staged 的 cwd 即仓库根目录）
const root = process.cwd()

// 直接通过 node 运行 ESLint 可执行文件，避免依赖 pnpm exec / 系统 PATH
const eslint = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js')

// lint-staged 会把暂存文件路径作为参数追加到命令尾部，这里转为绝对路径
const files = process.argv.slice(2).map((f) => path.resolve(root, f))

// 生成以某目录为前缀的绝对路径匹配器（末尾带分隔符，保证按目录边界匹配）
const joinRoot = (...p) => path.join(root, ...p) + path.sep

// 按文件所属 package 分组
const webFiles = files.filter((f) => f.startsWith(joinRoot('apps', 'web')))
const apiFiles = files.filter((f) => f.startsWith(joinRoot('apps', 'api')))

// 只要有一组校验失败，最终就返回非 0，从而拦截本次提交
let failed = false

// 在指定目录下运行 ESLint，--max-warnings=0 表示 warning 也视为失败（严格模式）
function run(cwd, list) {
  if (!list.length) return
  const r = spawnSync(process.execPath, [eslint, '--max-warnings=0', ...list], {
    cwd,
    stdio: 'inherit',
  })
  if (r.status !== 0) failed = true
}

// web 文件：Nuxt 配置需要在 apps/web 目录下加载
run(path.join(root, 'apps', 'web'), webFiles)
// api 文件：使用 apps/api 下的 TypeScript ESLint 配置
run(path.join(root, 'apps', 'api'), apiFiles)

// 任一目录校验失败则以 1 退出，阻止提交
process.exit(failed ? 1 : 0)
