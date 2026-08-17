/** 设计交付版本时间线规则测试。 */
import { describe, expect, it } from 'vitest'
import { createDeliverableVersionTimeline } from './deliverable-version-timeline'

describe('createDeliverableVersionTimeline', () => {
  it('按交付时间倒序排列并为最新记录编号最高版本', () => {
    const timeline = createDeliverableVersionTimeline([
      { id: 'v1', deliveredAt: '2026-08-14T10:00:00.000Z' },
      { id: 'v3', deliveredAt: '2026-08-16T10:00:00.000Z' },
      { id: 'v2', deliveredAt: '2026-08-15T10:00:00.000Z' },
    ])

    expect(timeline).toEqual([
      { id: 'v3', deliveredAt: '2026-08-16T10:00:00.000Z', version: 3 },
      { id: 'v2', deliveredAt: '2026-08-15T10:00:00.000Z', version: 2 },
      { id: 'v1', deliveredAt: '2026-08-14T10:00:00.000Z', version: 1 },
    ])
  })
})
