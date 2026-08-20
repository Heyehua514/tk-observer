/** 通知偏好模型测试；权限：无数据写入；用途：保证默认开启和类别文案稳定。 */
import { describe, expect, it } from 'vitest'
import {
  defaultNotificationPreferences,
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
})
