/** 通知列表筛选模型；权限：当前用户只读；用途：统一列表与铃铛筛选口径。 */
import type { AppNotification, NotificationType } from '@/types/notification'

export type NotificationFilter = 'all' | 'unread' | NotificationType

export function filterNotifications(
  items: readonly AppNotification[],
  filter: NotificationFilter
): AppNotification[] {
  if (filter === 'all') return [...items]
  if (filter === 'unread') return items.filter((item) => !item.isRead)
  return items.filter((item) => item.type === filter)
}

export const notificationFilterLabels: Record<NotificationFilter, string> = {
  all: '全部',
  unread: '未读',
  deadline: '到期',
  design_review: '审核',
  gmv_target: 'GMV',
  comment: '跟进',
  opportunity_won: '成交',
}
