/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/editing
// 权限：editing, boss；具备视频数据导入能力的 business 账号也可进入
// 用途：剪辑人员维护视频任务、成片归档与发布排期
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { EditingWorkbench, type EditingSearchParams } from '@/features/editing'
import {
  defaultEditingSearch,
  videoAccounts,
  videoTypes,
} from '@/features/editing/constants'
import type { VideoIdeaListParams } from '@/features/editing/types'

function parseSearch(search: Record<string, unknown>): EditingSearchParams {
  const account = videoAccounts.includes(
    search.account as (typeof videoAccounts)[number]
  )
    ? (search.account as VideoIdeaListParams['account'])
    : defaultEditingSearch.account
  const videoType = videoTypes.includes(
    search.videoType as (typeof videoTypes)[number]
  )
    ? (search.videoType as VideoIdeaListParams['videoType'])
    : defaultEditingSearch.videoType
  const sort = ['-views', '-completion_rate', '-follower_gain'].includes(
    String(search.sort)
  )
    ? (search.sort as VideoIdeaListParams['sort'])
    : defaultEditingSearch.sort
  const section = ['ideas', 'competitors', 'trends', 'production'].includes(
    String(search.section)
  )
    ? (search.section as EditingSearchParams['section'])
    : defaultEditingSearch.section
  const tab = search.tab === 'analytics' ? 'analytics' : 'list'
  return {
    ...defaultEditingSearch,
    query: typeof search.query === 'string' ? search.query : '',
    section,
    tab,
    page: Number(search.page) > 0 ? Number(search.page) : 1,
    perPage: Number(search.perPage) > 0 ? Number(search.perPage) : 20,
    account,
    videoType,
    tag: typeof search.tag === 'string' ? search.tag : '',
    dateFrom: typeof search.dateFrom === 'string' ? search.dateFrom : '',
    dateTo: typeof search.dateTo === 'string' ? search.dateTo : '',
    viral: ['all', 'viral', 'normal'].includes(String(search.viral))
      ? (search.viral as EditingSearchParams['viral'])
      : 'all',
    sort,
    recordType: search.recordType === 'video' ? 'video' : undefined,
    recordId: typeof search.recordId === 'string' ? search.recordId : undefined,
  }
}

export const Route = createFileRoute('/_app/editing/')({
  beforeLoad: () => requireRoles(['editing', 'business']),
  validateSearch: parseSearch,
  component: EditingRoute,
  errorComponent: RouteError,
})

function EditingRoute() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/editing/' })
  return (
    <EditingWorkbench
      params={params}
      onParamsChange={(patch) =>
        void navigate({
          search: (previous) => ({ ...previous, ...patch }),
          replace: true,
        })
      }
    />
  )
}
