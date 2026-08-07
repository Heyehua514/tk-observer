import { describe, expect, it } from 'vitest'
import { calculateTeamMemoryMetrics } from './team-memory-metrics'

describe('calculateTeamMemoryMetrics', () => {
  it('groups current-month lessons and returns the top three reasons', () => {
    const result = calculateTeamMemoryMetrics(
      [
        { id: '1', reason: '报价过高', recordedAt: '2026-08-01T00:00:00Z' },
        { id: '2', reason: '报价过高', recordedAt: '2026-08-02T00:00:00Z' },
        { id: '3', reason: '跟进超期', recordedAt: '2026-08-03T00:00:00Z' },
        { id: '4', reason: '需求不匹配', recordedAt: '2026-08-04T00:00:00Z' },
        { id: '5', reason: '预算取消', recordedAt: '2026-08-05T00:00:00Z' },
        { id: '6', reason: '旧案例', recordedAt: '2026-07-20T00:00:00Z' },
      ],
      4,
      [3, 2, 0],
      new Date('2026-08-06T04:00:00Z')
    )

    expect(result.topLessons).toEqual([
      { reason: '报价过高', count: 2 },
      { reason: '跟进超期', count: 1 },
      { reason: '需求不匹配', count: 1 },
    ])
    expect(result.loop).toEqual({
      cronRuns: 4,
      templateUses: 5,
      failedCases: 5,
    })
  })
})
