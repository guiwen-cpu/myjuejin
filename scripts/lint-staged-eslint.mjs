import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const eslint = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js')
const files = process.argv.slice(2).map((f) => path.resolve(root, f))

const joinRoot = (...p) => path.join(root, ...p) + path.sep
const webFiles = files.filter((f) => f.startsWith(joinRoot('apps', 'web')))
const apiFiles = files.filter((f) => f.startsWith(joinRoot('apps', 'api')))

let failed = false

function run(cwd, list) {
  if (!list.length) return
  const r = spawnSync(process.execPath, [eslint, '--max-warnings=0', ...list], {
    cwd,
    stdio: 'inherit',
  })
  if (r.status !== 0) failed = true
}

run(path.join(root, 'apps', 'web'), webFiles)
run(path.join(root, 'apps', 'api'), apiFiles)

process.exit(failed ? 1 : 0)
