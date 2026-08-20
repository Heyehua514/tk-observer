/** 通知筛选纯函数测试；权限：无数据写入。 */
import type { AppNotification } from '@/types/notification'
import { describe, expect, it } from 'vitest'
import { filterNotifications } from './notification-list-model'

const items: AppNotification[] = [
  {
    id: '1',
    recipient: 'u',
    type: 'deadline',
    title: '到期',
    content: 'a',
    link: '',
    isRead: false,
    created: '2026-08-20',
  },
  {
    id: '2',
    recipient: 'u',
    type: 'design_review',
    title: '审核',
    content: 'b',
    link: '',
    isRead: true,
    created: '2026-08-20',
  },
  {
    id: '3',
    recipient: 'u',
    type: 'opportunity_won',
    title: '成交',
    content: 'c',
    link: '',
    isRead: false,
    created: '2026-08-20',
  },
]

describe('filterNotifications', () => {
  it('keeps order and does not mutate for all', () => {
    expect(filterNotifications(items, 'all').map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
    ])
  })
  it('filters unread and notification types', () => {
    expect(filterNotifications(items, 'unread').map((item) => item.id)).toEqual(
      ['1', '3']
    )
    expect(
      filterNotifications(items, 'design_review').map((item) => item.id)
    ).toEqual(['2'])
  })
})
