// 首页视觉辅助：文章没有封面图时，用「种子值」生成稳定的渐变/彩色样式，
// 同一篇文章每次渲染颜色一致，避免引入纯装饰图片资源。

export const GRADIENT_CLASSES = [
  'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700',
  'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
  'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
  'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600',
  'bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700',
  'bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700',
  'bg-gradient-to-br from-indigo-500 via-blue-700 to-sky-800',
  'bg-gradient-to-br from-lime-500 via-emerald-600 to-teal-700',
] as const

export function gradientForSeed(seed: number): string {
  return GRADIENT_CLASSES[Math.abs(seed) % GRADIENT_CLASSES.length] ?? GRADIENT_CLASSES[0]
}

export const TAG_CHIP_CLASSES = [
  'bg-sky-50 text-sky-700 hover:bg-sky-100',
  'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  'bg-amber-50 text-amber-700 hover:bg-amber-100',
  'bg-rose-50 text-rose-700 hover:bg-rose-100',
  'bg-violet-50 text-violet-700 hover:bg-violet-100',
  'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
  'bg-lime-50 text-lime-700 hover:bg-lime-100',
  'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100',
  'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  'bg-teal-50 text-teal-700 hover:bg-teal-100',
] as const

export function tagChipForSeed(seed: number): string {
  return TAG_CHIP_CLASSES[Math.abs(seed) % TAG_CHIP_CLASSES.length] ?? TAG_CHIP_CLASSES[0]
}
