/** 通知打开服务；用途：已读回写失败时仍导航到目标资源。 */
import { useNavigate } from '@tanstack/react-router'
import type { AppNotification } from '@/types/notification'
import { toast } from 'sonner'
import { useMarkNotificationRead } from '@/hooks/use-mark-notification-read'
import {
  buildNotificationSearch,
  resolveNotificationTarget,
} from './notification-target'

export function useOpenNotification() {
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  return async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markRead.mutateAsync([notification.id])
      } catch {
        toast.warning('已打开目标，但未能标记为已读')
      }
    }
    const target = resolveNotificationTarget(notification)
    await navigate({
      to: target.to,
      search: buildNotificationSearch(target),
      replace: true,
    })
  }
}
