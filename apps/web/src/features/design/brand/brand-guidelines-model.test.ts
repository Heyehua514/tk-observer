import { describe, expect, it } from 'vitest'
import { DEFAULT_BRAND_GUIDELINES, filterBrandColors } from './brand-guidelines-model'

describe('brand guidelines model', () => {
  it('contains complete default color guidelines', () => {
    expect(DEFAULT_BRAND_GUIDELINES.colors.length).toBeGreaterThan(0)
    const primary = DEFAULT_BRAND_GUIDELINES.colors.find(c => c.role === 'primary')
    expect(primary).toBeDefined()
    expect(primary?.hex).toBe('#06B6D4')
  })

  it('filters colors by role accurately', () => {
    const backgrounds = filterBrandColors(DEFAULT_BRAND_GUIDELINES.colors, 'background')
    expect(backgrounds.every(c => c.role === 'background')).toBe(true)
    expect(filterBrandColors(DEFAULT_BRAND_GUIDELINES.colors, 'all').length).toBe(DEFAULT_BRAND_GUIDELINES.colors.length)
  })

  it('has non-empty typography and prohibitions', () => {
    expect(DEFAULT_BRAND_GUIDELINES.typography.length).toBeGreaterThan(0)
    expect(DEFAULT_BRAND_GUIDELINES.prohibitions.length).toBeGreaterThan(0)
  })
})