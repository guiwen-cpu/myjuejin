// 将 tsc 产出的 ESM 文件重命名为 .mjs
// 因为 packages/shared 的 package.json 没有 "type": "module"，
// .js 会被 Node 当作 CommonJS，必须用 .mjs 显式声明 ESM。
import { renameSync } from 'node:fs'

renameSync('dist/esm/index.js', 'dist/esm/index.mjs')
console.log('shared ESM build -> dist/esm/index.mjs')
