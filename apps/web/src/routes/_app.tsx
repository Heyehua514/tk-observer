/** 路由：主应用区；权限：任意已登录角色；用途：统一应用布局和会话守卫。 */
import { createFileRoute } from '@tanstack/react-router'
import { requireAuthentication } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { RouteError } from '@/components/shared/route-error'

export const Route = createFileRoute('/_app')({
  beforeLoad: requireAuthentication,
  component: AppShell,
  errorComponent: RouteError,
})
