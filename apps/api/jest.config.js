/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    // 直接映射到 shared 的 TS 源码，由 ts-jest 编译，
    // 不再依赖 dist 产物格式（ESM/CJS 均可）
    '^@devshare/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
}
