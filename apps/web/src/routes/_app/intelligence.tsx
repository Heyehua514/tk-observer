/** 路由：/intelligence；权限：所有已登录角色；用途：统一每日情报池。 */
import { createFileRoute } from '@tanstack/react-router'
import { requirePathAccess } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { IntelligencePage } from '@/features/intelligence'

export const Route = createFileRoute('/_app/intelligence')({
  beforeLoad: () => requirePathAccess('/intelligence'),
  component: IntelligencePage,
  errorComponent: RouteError,
})
