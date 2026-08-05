/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/editing
// 权限：editing, boss
// 用途：剪辑人员维护视频任务、成片归档与发布排期
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { EditingWorkbench, type EditingSearchParams } from '@/features/editing'

function parseSearch(search: Record<string, unknown>): EditingSearchParams {
  return {
    query: typeof search.query === 'string' ? search.query : '',
    recordType: search.recordType === 'video' ? 'video' : undefined,
    recordId: typeof search.recordId === 'string' ? search.recordId : undefined,
  }
}

export const Route = createFileRoute('/_app/editing/')({
  beforeLoad: () => requireRoles(['editing']),
  validateSearch: parseSearch,
  component: EditingRoute,
  errorComponent: RouteError,
})

function EditingRoute() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/editing/' })
  return (
    <EditingWorkbench
      query={params.query}
      onQueryChange={(query) =>
        void navigate({
          search: (previous) => ({ ...previous, query }),
          replace: true,
        })
      }
    />
  )
}
