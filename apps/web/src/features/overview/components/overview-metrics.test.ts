/** 总览经营指标时间范围与人民币口径测试。 */
import { describe, expect, it } from 'vitest'
import {
  CNY_ACCOUNTING_NOTE,
  filterGmvMetricsByRange,
  type OverviewMetricRange,
} from './overview-metrics'

const metrics = [
  { id: 'old', metricDate: '2026-07-15', amountMinor: 10000 },
  { id: 'month', metricDate: '2026-08-03', amountMinor: 20000 },
  { id: 'week', metricDate: '2026-08-14', amountMinor: 30000 },
]

describe('filterGmvMetricsByRange', () => {
  const now = new Date('2026-08-17T12:00:00+08:00')

  it.each<[OverviewMetricRange, string[]]>([
    ['7d', ['week']],
    ['30d', ['month', 'week']],
    ['all', ['old', 'month', 'week']],
  ])(
    'filters %s GMV records at the Beijing calendar boundary',
    (range, ids) => {
      expect(
        filterGmvMetricsByRange(metrics, range, now).map((item) => item.id)
      ).toEqual(ids)
    }
  )

  it('documents that dashboard amounts are shown in CNY yuan', () => {
    expect(CNY_ACCOUNTING_NOTE).toContain('人民币')
    expect(CNY_ACCOUNTING_NOTE).toContain('分')
  })
})
