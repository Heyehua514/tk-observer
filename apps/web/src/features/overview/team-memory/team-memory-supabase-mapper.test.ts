/** 总览团队记忆 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseDailyReport,
  mapSupabaseFailedCase,
} from './team-memory-supabase-mapper'

describe('team memory Supabase mapper', () => {
  it('maps the latest daily report into the existing overview model', () => {
    expect(
      mapSupabaseDailyReport({
        date: '2026-08-13T10:00:00Z',
        highlights: '今日完成市场资源切 Supabase。',
      })
    ).toEqual({
      dailyDate: '2026-08-13T10:00:00Z',
      dailyHighlight: '今日完成市场资源切 Supabase。',
    })
  })

  it('maps failed cases and keeps empty reasons visible to metrics fallback', () => {
    expect(
      mapSupabaseFailedCase({
        id: 'case-1',
        reason: '',
        recorded_at: '2026-08-13T08:00:00Z',
      })
    ).toEqual({
      id: 'case-1',
      reason: '',
      recordedAt: '2026-08-13T08:00:00Z',
    })
  })
})
