import { describe, expect, it } from 'vitest'

const svgAssets = import.meta.glob('./*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>
const source = svgAssets['./tk-observer-mark.svg']

describe('TK观察正方形 Logo', () => {
  it('提供独立的 1024 正方形 SVG 设计源', () => {
    expect(source).toBeTypeOf('string')
    if (!source) return
    expect(source).toContain('viewBox="0 0 1024 1024"')
    expect(source).toContain('data-brand="tk-observer"')
    expect(source).toContain('data-symbol="observation-eye"')
  })

  it('不依赖字体、外链或复杂滤镜', () => {
    expect(source).toBeTypeOf('string')
    if (!source) return
    expect(source).not.toMatch(/<text|font-family|href=|<filter/i)
    expect(source).not.toMatch(/linearGradient|radialGradient/i)
  })

  it('将主色数量限制为四个', () => {
    expect(source).toBeTypeOf('string')
    if (!source) return
    const colors = new Set(source.match(/#[0-9A-Fa-f]{6}/g) ?? [])
    expect(colors.size).toBeLessThanOrEqual(4)
  })
})
