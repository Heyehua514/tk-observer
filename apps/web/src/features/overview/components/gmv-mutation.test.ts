/** GMV 汇总纯函数测试。 */
import { describe, expect, it } from 'vitest'
import { aggregateGmvByDay } from './gmv-mutation'

describe('aggregateGmvByDay', () => {
  it('按日期升序排序并输出 MM-DD 键', () => {
    const result = aggregateGmvByDay([
      { metricDate: '2026-08-15T00:00:00+08:00', amountMinor: 163000 },
      { metricDate: '2026-08-08T00:00:00+08:00', amountMinor: 184000 },
      { metricDate: '2026-08-01T00:00:00+08:00', amountMinor: 126000 },
    ])
    expect(result).toEqual([
      { date: '08-01', value: 126000 },
      { date: '08-08', value: 184000 },
      { date: '08-15', value: 163000 },
    ])
  })

  it('空数组返回空', () => {
    expect(aggregateGmvByDay([])).toEqual([])
  })
})
