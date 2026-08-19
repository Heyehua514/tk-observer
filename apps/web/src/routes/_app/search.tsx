/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/search?q=&kind=；权限：已登录；用途：全局搜索“查看全部”结果页。
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { SearchResultsPage } from '@/features/search'

type SearchParams = { q: string; kind?: string }

function parseSearch(search: Record<string, unknown>): SearchParams {
  return {
    q: typeof search.q === 'string' ? search.q : '',
    kind: typeof search.kind === 'string' ? search.kind : undefined,
  }
}

export const Route = createFileRoute('/_app/search')({
  beforeLoad: () =>
    requireRoles(['business', 'boss', 'market', 'design', 'editing']),
  validateSearch: parseSearch,
  component: SearchRoute,
  errorComponent: RouteError,
})

function SearchRoute() {
  const params = Route.useSearch()
  return <SearchResultsPage query={params.q} kind={params.kind} />
}
