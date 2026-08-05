// 路由：/overview
// 权限：boss
// 用途：负责人查看全公司经营指标、动态与任务进度
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { OverviewDashboard } from '@/features/overview'

export const Route = createFileRoute('/_app/overview/')({
  beforeLoad: () => requireRoles(['boss']),
  component: OverviewDashboard,
  errorComponent: RouteError,
})
