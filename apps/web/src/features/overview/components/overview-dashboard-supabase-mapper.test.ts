/** 总览首页 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseAuditLog,
  mapSupabaseGmvMetric,
  mapSupabaseTeamTask,
} from './overview-dashboard-supabase-mapper'

describe('overview dashboard Supabase mapper', () => {
  it('maps core overview records without leaking database field names', () => {
    expect(
      mapSupabaseGmvMetric({
        id: 'gmv-1',
        metric_date: '2026-08-13T00:00:00Z',
        amount_minor: 1280000,
      })
    ).toEqual({
      id: 'gmv-1',
      metricDate: '2026-08-13T00:00:00Z',
      amountMinor: 1280000,
    })
    expect(
      mapSupabaseTeamTask({
        id: 'task-1',
        assignee_name: '董雨辰',
        progress: 66,
      })
    ).toEqual({
      id: 'task-1',
      assigneeName: '董雨辰',
      progress: 66,
    })
    expect(
      mapSupabaseAuditLog({
        id: 'log-1',
        actor_name: '系统',
        action: 'daily-report',
        created_at: '2026-08-13T08:00:00Z',
      })
    ).toEqual({
      id: 'log-1',
      actorName: '系统',
      action: 'daily-report',
      created: '2026-08-13T08:00:00Z',
    })
  })
})
