/** 通知偏好模型；权限：当前登录用户；用途：稳定默认值、表单标签与提醒过滤口径。 */
import type { AppNotification, NotificationType } from '@/types/notification'

export type NotificationPreferences = {
  deadlineEnabled: boolean
  reviewEnabled: boolean
  followUpEnabled: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  deadlineEnabled: true,
  reviewEnabled: true,
  followUpEnabled: true,
}

export const notificationPreferenceItems = [
  {
    key: 'deadlineEnabled',
    title: '到期提醒',
    description: '活动任务和预计成交商机临近截止时提醒。',
  },
  {
    key: 'reviewEnabled',
    title: '审核提醒',
    description: '设计素材提交审核或审批结果变化时提醒。',
  },
  {
    key: 'followUpEnabled',
    title: '合作跟进提醒',
    description: '商机和渠道商单需要跟进时提醒。',
  },
] as const

const mutedTypesByPreference: Partial<
  Record<keyof NotificationPreferences, NotificationType>
> = {
  deadlineEnabled: 'deadline',
  reviewEnabled: 'design_review',
  followUpEnabled: 'comment',
}

/** 判断单个通知类型是否被本人偏好静音；成交与 GMV 里程碑始终允许。 */
export function isNotificationAllowedByPreferences(
  type: NotificationType,
  preferences?: NotificationPreferences | null
): boolean {
  if (!preferences) return true
  const entry = (
    Object.entries(mutedTypesByPreference) as [
      keyof NotificationPreferences,
      NotificationType,
    ][]
  ).find(([, mutedType]) => mutedType === type)
  if (!entry) return true
  return preferences[entry[0]] !== false
}

/** 按本人偏好过滤通知列表，返回未静音的部分。 */
export function filterNotificationsByPreferences(
  items: readonly AppNotification[],
  preferences?: NotificationPreferences | null
): AppNotification[] {
  if (!preferences) return [...items]
  return items.filter((item) =>
    isNotificationAllowedByPreferences(item.type, preferences)
  )
}
