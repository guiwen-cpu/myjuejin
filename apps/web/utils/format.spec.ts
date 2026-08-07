import { describe, expect, it } from 'vitest'
import { formatCount } from './format'

describe('formatCount', () => {
  it('小于 1000 原样返回', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(999)).toBe('999')
  })

  it('千位缩写', () => {
    expect(formatCount(1500)).toBe('1.5k')
  })

  it('万位缩写', () => {
    expect(formatCount(12345)).toBe('1.2w')
  })
})
