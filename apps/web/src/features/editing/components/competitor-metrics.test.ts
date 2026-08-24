import { describe, expect, it } from 'vitest'
import {
  formatMetric,
  getEngagementRate,
  getTrafficLabel,
} from './competitor-metrics'

describe('competitor metrics', () => {
  it('calculates engagement rate from views and likes', () => {
    expect(getEngagementRate(2500, 125)).toBe(5)
    expect(getEngagementRate(0, 10)).toBe(0)
  })

  it('labels traffic using the available average views baseline', () => {
    expect(getTrafficLabel(20000, 10000)).toBe('高于均播')
    expect(getTrafficLabel(10000, 10000)).toBe('接近均播')
    expect(getTrafficLabel(5000, 10000)).toBe('低于均播')
  })

  it('formats large metrics for compact cards', () => {
    expect(formatMetric(12500)).toBe('1.3万')
    expect(formatMetric(850)).toBe('850')
  })
})
