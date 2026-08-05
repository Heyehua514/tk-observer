/** 入口路由：未登录进入登录页，已登录进入角色默认工作台。 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getDefaultRoute } from '@/lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    throw redirect({ to: user ? getDefaultRoute(user.role) : '/login' })
  },
})
