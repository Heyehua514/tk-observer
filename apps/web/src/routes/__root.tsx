/** 根路由：全局 ErrorBoundary、404 与 toast 容器。 */
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { RouteError } from '@/components/shared/route-error'
import { NotFoundError } from '@/features/errors/not-found-error'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <>
        <Toaster duration={5000} richColors />
        <Outlet />
      </>
    ),
    notFoundComponent: NotFoundError,
    errorComponent: RouteError,
  }
)
