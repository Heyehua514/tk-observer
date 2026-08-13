/** 通知 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { mapSupabaseNotification } from './notification-supabase-mapper'

describe('mapSupabaseNotification', () => {
  it('maps the Supabase notification row into the app notification model', () => {
    expect(
      mapSupabaseNotification({
        id: 'notice-1',
        recipient_id: 'user-1',
        type: 'deadline',
        title: '活动任务今天到期',
        content: '请处理 P2 宣发任务',
        link: '/market',
        is_read: false,
        created_at: '2026-08-13T09:00:00Z',
      })
    ).toEqual({
      id: 'notice-1',
      recipient: 'user-1',
      type: 'deadline',
      title: '活动任务今天到期',
      content: '请处理 P2 宣发任务',
      link: '/market',
      isRead: false,
      created: '2026-08-13T09:00:00Z',
    })
  })
})
