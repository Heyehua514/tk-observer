import { describe, expect, it } from 'vitest'
import {
  calculateEngagementRate,
  formatGmv,
} from './video-metrics-model'

describe('video-metrics-model', () => {
  it('formats GMV from cents to currency string', () => {
    expect(formatGmv(0)).toBe('0.00')
    expect(formatGmv(1250)).toBe('12.50')
    expect(formatGmv(100000)).toBe('1,000.00')
    expect(formatGmv(-50)).toBe('0.00')
  })

  it('calculates engagement rate accurately', () => {
    expect(calculateEngagementRate({ views: 0, likes: 10, comments: 2, shares: 1 })).toBe(0)
    expect(
      calculateEngagementRate({
        views: 1000,
        likes: 50,
        comments: 20,
        shares: 10,
      })
    ).toBe(8)
    expect(
      calculateEngagementRate({
        views: 300,
        likes: 10,
        comments: 5,
        shares: 2,
      })
    ).toBe(5.67)
  })
})
