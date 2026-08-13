/** 团队日历 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseCalendarChannelOrder,
  mapSupabaseCalendarDesignRequirement,
  mapSupabaseCalendarEvent,
  mapSupabaseCalendarEventTask,
  mapSupabaseCalendarSocialPlan,
} from './team-calendar-supabase-mapper'

describe('team calendar Supabase mapper', () => {
  it('maps cross-workbench rows into unified calendar items', () => {
    expect(
      mapSupabaseCalendarEvent({
        id: 'event-1',
        name: '厦门闭门沙龙',
        start_date: '2026-08-20T10:00:00Z',
      })
    ).toEqual({
      id: 'event-1',
      title: '厦门闭门沙龙',
      date: '2026-08-20T10:00:00Z',
      type: 'activity',
    })
    expect(
      mapSupabaseCalendarEventTask({
        id: 'task-1',
        title: '确认嘉宾',
        due_date: '2026-08-18T10:00:00Z',
      })
    ).toEqual({
      id: 'task-1',
      title: '确认嘉宾',
      date: '2026-08-18T10:00:00Z',
      type: 'task',
    })
    expect(
      mapSupabaseCalendarDesignRequirement({
        id: 'design-1',
        title: '活动主视觉',
        due_date: '2026-08-17T10:00:00Z',
      })
    ).toEqual({
      id: 'design-1',
      title: '活动主视觉',
      date: '2026-08-17T10:00:00Z',
      type: 'design',
    })
    expect(
      mapSupabaseCalendarSocialPlan({
        id: 'social-1',
        content: '发布金鳞会招商朋友圈长内容',
        date: '2026-08-16T10:00:00Z',
      }).title
    ).toBe('发布金鳞会招商朋友圈长内容')
    expect(
      mapSupabaseCalendarChannelOrder({
        id: 'order-1',
        title: '美妆达人商单',
        publish_date: '2026-08-22T10:00:00Z',
      }).type
    ).toBe('order')
  })
})
