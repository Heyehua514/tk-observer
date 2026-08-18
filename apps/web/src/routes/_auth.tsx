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
    <main className='dark relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4 text-foreground'>
      <div
        aria-hidden='true'
        className='aurora aurora-animated pointer-events-none absolute inset-0'
      />
      <div className='relative z-10 w-full max-w-[850px]'>
        <Outlet />
      </div>
    </main>
  ),
})
