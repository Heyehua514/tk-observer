/** 路由：认证区；权限：未登录；用途：隔离登录界面。 */
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getDefaultRoute } from '@/lib/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user) throw redirect({ to: getDefaultRoute(user.role) })
  },
  component: () => (
    <main className='flex min-h-svh items-center justify-center bg-muted/40 p-4'>
      <Outlet />
    </main>
  ),
})
