/** 路由：/settings/notifications；权限：所有已登录角色；用途：通知偏好。 */
import { createFileRoute } from '@tanstack/react-router'
import { RouteError } from '@/components/shared/route-error'
import { NotificationPreferencesPage } from '@/features/settings/notification-preferences'

export const Route = createFileRoute('/_app/settings/notifications')({
  component: NotificationPreferencesPage,
  errorComponent: RouteError,
})
