/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/market
// 权限：market, boss
// 用途：市场人员维护选品、竞品、投放与活动排期
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { MarketWorkbench, type MarketSearchParams } from '@/features/market'

function parseSearch(search: Record<string, unknown>): MarketSearchParams {
  return {
    query: typeof search.query === 'string' ? search.query : '',
    recordType: search.recordType === 'product' ? 'product' : undefined,
    recordId: typeof search.recordId === 'string' ? search.recordId : undefined,
  }
}

export const Route = createFileRoute('/_app/market/')({
  beforeLoad: () => requireRoles(['market']),
  validateSearch: parseSearch,
  component: MarketRoute,
  errorComponent: RouteError,
})

function MarketRoute() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/market/' })
  return (
    <MarketWorkbench
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
