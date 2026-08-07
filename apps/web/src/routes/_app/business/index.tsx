/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/business
// 权限：business, boss
// 用途：商务人员管理合作达人，支持搜索、筛选、分页和完整 CRUD
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { BusinessWorkbench } from '@/features/business'
import { cooperationStatuses, regions } from '@/features/business/constants'
import type {
  CompanyListParams,
  CreatorListParams,
} from '@/features/business/types'

type BusinessSearch = CreatorListParams & {
  tab?:
    | 'dashboard'
    | 'creators'
    | 'companies'
    | 'clients'
    | 'opportunities'
    | 'orders'
    | 'social'
    | 'sponsorships'
  companyPage: number
  companyQuery: string
  companyRegion: CompanyListParams['region']
  companyKind: CompanyListParams['kind']
  companySort: CompanyListParams['sort']
  recordType?: 'creator' | 'company'
  recordId?: string
}

function parseSearch(search: Record<string, unknown>): BusinessSearch {
  const region =
    typeof search.region === 'string' &&
    regions.some((value) => value === search.region)
      ? (search.region as CreatorListParams['region'])
      : 'all'
  const status =
    typeof search.status === 'string' &&
    cooperationStatuses.some((value) => value === search.status)
      ? (search.status as CreatorListParams['status'])
      : 'all'
  const sorts: CreatorListParams['sort'][] = [
    'created',
    '-created',
    'updated',
    '-updated',
    'nickname',
    '-nickname',
  ]
  const sort =
    typeof search.sort === 'string' &&
    sorts.some((value) => value === search.sort)
      ? (search.sort as CreatorListParams['sort'])
      : '-updated'
  return {
    page: typeof search.page === 'number' && search.page > 0 ? search.page : 1,
    perPage: 20,
    query: typeof search.query === 'string' ? search.query : '',
    region,
    status,
    sort,
    tab: [
      'dashboard',
      'creators',
      'companies',
      'clients',
      'opportunities',
      'orders',
      'social',
      'sponsorships',
    ].includes(String(search.tab))
      ? (search.tab as BusinessSearch['tab'])
      : 'dashboard',
    companyPage:
      typeof search.companyPage === 'number' && search.companyPage > 0
        ? search.companyPage
        : 1,
    companyQuery:
      typeof search.companyQuery === 'string' ? search.companyQuery : '',
    companyRegion:
      typeof search.companyRegion === 'string' &&
      regions.some((value) => value === search.companyRegion)
        ? (search.companyRegion as CompanyListParams['region'])
        : 'all',
    companyKind:
      search.companyKind === 'client' || search.companyKind === 'supplier'
        ? search.companyKind
        : 'all',
    companySort:
      search.companySort === '-created' ||
      search.companySort === 'company_name' ||
      search.companySort === '-company_name'
        ? search.companySort
        : '-updated',
    recordType:
      search.recordType === 'creator' || search.recordType === 'company'
        ? search.recordType
        : undefined,
    recordId: typeof search.recordId === 'string' ? search.recordId : undefined,
  }
}

export const Route = createFileRoute('/_app/business/')({
  beforeLoad: () => requireRoles(['business']),
  validateSearch: parseSearch,
  component: BusinessRoute,
  errorComponent: RouteError,
})

function BusinessRoute() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/business/' })
  return (
    <BusinessWorkbench
      params={params}
      companyParams={{
        page: params.companyPage,
        perPage: 20,
        query: params.companyQuery,
        region: params.companyRegion,
        kind: params.companyKind,
        sort: params.companySort,
      }}
      tab={params.tab || 'dashboard'}
      onParamsChange={(patch) =>
        void navigate({
          search: (previous) => ({ ...previous, ...patch }),
          replace: true,
        })
      }
      onCompanyParamsChange={(patch) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            ...(patch.page !== undefined ? { companyPage: patch.page } : {}),
            ...(patch.query !== undefined ? { companyQuery: patch.query } : {}),
            ...(patch.region !== undefined
              ? { companyRegion: patch.region }
              : {}),
            ...(patch.kind !== undefined ? { companyKind: patch.kind } : {}),
            ...(patch.sort !== undefined ? { companySort: patch.sort } : {}),
          }),
          replace: true,
        })
      }
      onTabChange={(tab) =>
        void navigate({
          search: (previous) => ({ ...previous, tab }),
          replace: true,
        })
      }
    />
  )
}
