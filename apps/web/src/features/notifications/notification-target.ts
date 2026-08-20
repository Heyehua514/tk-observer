/** 通知深链解析；权限：当前用户导航；用途：铃铛和通知中心共用。 */
import type { AppNotification } from '@/types/notification'

export type DeepLinkTarget = {
  to: string
  recordType?: 'opportunity'
  recordId?: string
  taskId?: string
}

const allowedLinks = [
  '/overview',
  '/business',
  '/market',
  '/design',
  '/editing',
  '/settings',
] as const

export function resolveNotificationTarget(
  notification: AppNotification
): DeepLinkTarget {
  const base = allowedLinks.find((path) => notification.link === path)
  const recordType = notification.recordType
  const recordId = notification.recordId
  if (recordType === 'opportunity' && base === '/business') {
    return { to: '/business', recordType, recordId }
  }
  if (recordType === 'event_task') {
    const match = /^\/market\/events\/[^/?#]+/.exec(notification.link)
    return { to: match?.[0] || '/market', taskId: recordId }
  }
  return { to: base || '/overview' }
}
