import { describe, expect, it } from 'vitest'
import type { VideoMetricsLog } from './video-metrics-model'
import {
  buildMetricsTrend,
  calculateMedian,
  getDeltaBarPercent,
  MIN_BASELINE_SAMPLES,
  VIRAL_MULTIPLIER,
} from './video-metrics-trend'

function log(id: string, loggedAt: string, views: number, likes: number): VideoMetricsLog {
  return {
    id,
    videoId: 'video-1',
    loggedAt,
    views,
    likes,
    comments: 0,
    shares: 0,
    completionRate: 0,
    conversionGmvCents: 0,
    orderCount: 0,
    operatorName: '测试',
  }
}

describe('video-metrics-trend', () => {
  it('calculates median for odd and even samples', () => {
    expect(calculateMedian([])).toBe(0)
    expect(calculateMedian([3, 1, 2])).toBe(2)
    expect(calculateMedian([4, 1, 3, 2])).toBe(2.5)
    expect(calculateMedian([Number.NaN, 5])).toBe(5)
  })

  it('sorts logs ascending and computes deltas from the first baseline', () => {
    const trend = buildMetricsTrend([
      log('b', '2026-11-02T10:00:00.000Z', 1200, 60),
      log('a', '2026-11-01T10:00:00.000Z', 1000, 50),
      log('c', '2026-11-03T10:00:00.000Z', 1800, 90),
    ])

    expect(trend.points.map((point) => point.id)).toEqual(['a', 'b', 'c'])
    expect(trend.points[0]).toMatchObject({ viewDelta: 0, likeDelta: 0 })
    expect(trend.points[1]).toMatchObject({ viewDelta: 200, likeDelta: 10 })
    expect(trend.points[2]).toMatchObject({ viewDelta: 600, likeDelta: 30 })
    expect(trend.totalViewDelta).toBe(800)
    expect(trend.totalLikeDelta).toBe(40)
    expect(trend.peakViewDelta).toBe(600)
  })

  it('clamps downward metric corrections to zero instead of producing negative growth', () => {
    const trend = buildMetricsTrend([
      log('a', '2026-11-01T10:00:00.000Z', 1000, 50),
      log('b', '2026-11-02T10:00:00.000Z', 800, 40),
    ])

    expect(trend.points[1]).toMatchObject({ viewDelta: 0, likeDelta: 0 })
    expect(trend.totalViewDelta).toBe(0)
  })

  it('does not flag viral before the minimum baseline samples exist', () => {
    const trend = buildMetricsTrend([
      log('a', '2026-11-01T10:00:00.000Z', 1000, 10),
      log('b', '2026-11-02T10:00:00.000Z', 2000, 20),
    ])

    expect(MIN_BASELINE_SAMPLES).toBe(2)
    expect(trend.viralCount).toBe(0)
  })

  it('flags a viral increment when it reaches the median baseline multiplier', () => {
    const trend = buildMetricsTrend([
      log('a', '2026-11-01T10:00:00.000Z', 1000, 10),
      log('b', '2026-11-02T10:00:00.000Z', 1100, 20),
      log('c', '2026-11-03T10:00:00.000Z', 1200, 30),
      log('d', '2026-11-04T10:00:00.000Z', 1500, 40),
    ])

    expect(VIRAL_MULTIPLIER).toBe(1.5)
    expect(trend.points[3].viral).toBe(true)
    expect(trend.viralCount).toBe(1)
    expect(trend.medianViewDelta).toBe(100)
  })

  it('does not flag a spike when the baseline is flat', () => {
    const trend = buildMetricsTrend([
      log('a', '2026-11-01T10:00:00.000Z', 1000, 10),
      log('b', '2026-11-02T10:00:00.000Z', 1000, 10),
      log('c', '2026-11-03T10:00:00.000Z', 1000, 10),
    ])

    expect(trend.viralCount).toBe(0)
    expect(trend.totalViewDelta).toBe(0)
  })

  it('returns stable empty trend for missing data', () => {
    const trend = buildMetricsTrend([])
    expect(trend.points).toEqual([])
    expect(trend.viralCount).toBe(0)
    expect(trend.medianViewDelta).toBe(0)
  })

  it('computes bounded bar percentages', () => {
    expect(getDeltaBarPercent(0, 0)).toBe(0)
    expect(getDeltaBarPercent(50, 100)).toBe(50)
    expect(getDeltaBarPercent(500, 100)).toBe(100)
    expect(getDeltaBarPercent(Number.NaN, 100)).toBe(0)
  })
})