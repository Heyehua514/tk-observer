// 路由：/overview/calendar
// 权限：boss
// 用途：全公司活动、审核、交付和发布排期月视图
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { TeamCalendar } from '@/features/overview'

export const Route = createFileRoute('/_app/overview/calendar')({
  beforeLoad: () => requireRoles(['boss']),
  component: TeamCalendar,
  errorComponent: RouteError,
})
