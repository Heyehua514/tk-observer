/** 通知偏好模型测试；权限：无数据写入；用途：保证默认开启、类别文案稳定与偏好过滤准确。 */
import type { AppNotification } from '@/types/notification'
import { describe, expect, it } from 'vitest'
import {
  defaultNotificationPreferences,
  filterNotificationsByPreferences,
  isNotificationAllowedByPreferences,
  notificationPreferenceItems,
} from './notification-preferences-model'

describe('notification preferences model', () => {
  it('defaults every team reminder category to enabled', () => {
    expect(defaultNotificationPreferences).toEqual({
      deadlineEnabled: true,
      reviewEnabled: true,
      followUpEnabled: true,
    })
  })

  it('exposes three user-facing reminder categories', () => {
    expect(notificationPreferenceItems.map((item) => item.title)).toEqual([
      '到期提醒',
      '审核提醒',
      '合作跟进提醒',
    ])
  })

  it('allows all notifications when preferences are default or empty', () => {
    expect(
      isNotificationAllowedByPreferences(
        'deadline',
        defaultNotificationPreferences
      )
    ).toBe(true)
    expect(
      isNotificationAllowedByPreferences(
        'design_review',
        defaultNotificationPreferences
      )
    ).toBe(true)
    expect(
      isNotificationAllowedByPreferences(
        'comment',
        defaultNotificationPreferences
      )
    ).toBe(true)
    expect(isNotificationAllowedByPreferences('opportunity_won', null)).toBe(
      true
    )
  })

  it('filters out notifications that are muted by preferences while preserving milestones', () => {
    const prefs = {
      deadlineEnabled: false,
      reviewEnabled: false,
      followUpEnabled: true,
    }
    expect(isNotificationAllowedByPreferences('deadline', prefs)).toBe(false)
    expect(isNotificationAllowedByPreferences('design_review', prefs)).toBe(
      false
    )
    expect(isNotificationAllowedByPreferences('comment', prefs)).toBe(true)
    expect(isNotificationAllowedByPreferences('opportunity_won', prefs)).toBe(
      true
    )
    expect(isNotificationAllowedByPreferences('gmv_target', prefs)).toBe(true)

    const list: AppNotification[] = [
      {
        id: '1',
        recipient: 'u',
        type: 'deadline',
        title: '到期',
        content: 'c',
        link: '',
        isRead: false,
        created: '2026-10-20',
      },
      {
        id: '2',
        recipient: 'u',
        type: 'design_review',
        title: '审核',
        content: 'c',
        link: '',
        isRead: true,
        created: '2026-10-20',
      },
      {
        id: '3',
        recipient: 'u',
        type: 'comment',
        title: '跟进',
        content: 'c',
        link: '',
        isRead: false,
        created: '2026-10-20',
      },
      {
        id: '4',
        recipient: 'u',
        type: 'opportunity_won',
        title: '成交',
        content: 'c',
        link: '',
        isRead: false,
        created: '2026-10-20',
      },
    ]

    const filtered = filterNotificationsByPreferences(list, prefs)
    expect(filtered.map((item) => item.id)).toEqual(['3', '4'])
  })
})
