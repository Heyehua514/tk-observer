import { describe, expect, it } from 'vitest'

const svgAssets = import.meta.glob('./*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>
const source = svgAssets['./tk-observer-mark.svg']

describe('TK观察 Logo 视觉质量 eval', () => {
  it('使用一个观察主体和一个 TK 核心，不堆叠多个图标隐喻', () => {
    expect(source).toBeTypeOf('string')
    if (!source) return
    expect(source.match(/data-role="subject"/g)).toHaveLength(1)
    expect(source.match(/data-role="monogram"/g)).toHaveLength(1)
    expect(source.match(/data-role="signal"/g)).toHaveLength(1)
  })

  it('保留不低于 14% 的方形安全边距', () => {
    expect(source).toBeTypeOf('string')
    if (!source) return
    expect(source).toContain('data-safe-area="144"')
    expect(source).toContain('data-min-size="16"')
  })
})
