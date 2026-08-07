/** 总览工作台团队记忆时间口径回归测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { beijingBoundary } from './use-team-memory'

describe('beijingBoundary', () => {
  it('uses the current Beijing calendar day across the UTC date boundary', () => {
    expect(beijingBoundary(new Date('2026-08-06T17:30:00Z'), 'day')).toBe(
      '2026-08-06T16:00:00.000Z'
    )
  })
})
