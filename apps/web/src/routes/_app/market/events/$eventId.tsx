/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/market/events/$eventId；权限：market、boss；用途：活动六 Tab 详情。
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { ActivityDetail } from '@/features/market/activities/activity-detail'

export const Route = createFileRoute('/_app/market/events/$eventId')({
  beforeLoad: () => requireRoles(['market']),
  component: ActivityDetailRoute,
  errorComponent: RouteError,
})

function ActivityDetailRoute() {
  const { eventId } = Route.useParams()
  return <ActivityDetail eventId={eventId} />
}
