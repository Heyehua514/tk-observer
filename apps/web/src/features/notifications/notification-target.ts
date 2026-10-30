/** 通知深链解析；权限：当前用户导航；用途：铃铛和通知中心共用。 */
import type { AppNotification } from '@/types/notification'

export type DeepLinkTarget = {
  to: string
  recordType?: 'opportunity' | 'design_asset'
  recordId?: string
  taskId?: string
}

export type DeepLinkSearch = {
  taskId?: string
  recordType?: 'opportunity' | 'design_asset'
  recordId?: string
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
  if (recordType === 'design_asset' && base === '/design') {
    return { to: '/design', recordType, recordId }
  }
  if (recordType === 'event_task') {
    const match = /^\/market\/events\/[^/?#]+/.exec(notification.link)
    return { to: match?.[0] || '/market', taskId: recordId }
  }
  return { to: base || '/overview' }
}

export function buildNotificationSearch(
  target: DeepLinkTarget
): DeepLinkSearch {
  if (target.taskId) return { taskId: target.taskId }
  if (target.recordType && target.recordId) {
    return { recordType: target.recordType, recordId: target.recordId }
  }
  return {}
}
