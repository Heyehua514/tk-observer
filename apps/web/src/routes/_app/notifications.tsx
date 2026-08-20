/** 路由：/notifications；权限：所有已登录角色；用途：全量通知列表。 */
import { createFileRoute } from '@tanstack/react-router'
import { RouteError } from '@/components/shared/route-error'
import { NotificationsPage } from '@/features/notifications/notifications-page'

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
  errorComponent: RouteError,
})
