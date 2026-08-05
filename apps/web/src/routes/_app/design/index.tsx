/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/design
// 权限：design, boss
// 用途：设计人员维护素材、设计任务与品牌规范
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { regions } from '@/types/commerce'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { DesignWorkbench } from '@/features/design'
import { designAssetStatusLabels } from '@/features/design/constants'
import type { DesignAssetListParams } from '@/features/design/types'

function parseSearch(search: Record<string, unknown>): DesignAssetListParams {
  const statuses: DesignAssetListParams['status'][] = [
    'all',
    ...(Object.keys(
      designAssetStatusLabels
    ) as DesignAssetListParams['status'][]),
  ]
  const sorts: DesignAssetListParams['sort'][] = [
    '-updated',
    '-created',
    'file_name',
    '-file_name',
  ]
  return {
    query: typeof search.query === 'string' ? search.query : '',
    status:
      typeof search.status === 'string' &&
      statuses.includes(search.status as DesignAssetListParams['status'])
        ? (search.status as DesignAssetListParams['status'])
        : 'all',
    region:
      typeof search.region === 'string' &&
      regions.includes(search.region as (typeof regions)[number])
        ? (search.region as DesignAssetListParams['region'])
        : 'all',
    sort:
      typeof search.sort === 'string' &&
      sorts.includes(search.sort as DesignAssetListParams['sort'])
        ? (search.sort as DesignAssetListParams['sort'])
        : '-updated',
  }
}

export const Route = createFileRoute('/_app/design/')({
  beforeLoad: () => requireRoles(['design']),
  validateSearch: parseSearch,
  component: DesignRoute,
  errorComponent: RouteError,
})

function DesignRoute() {
  const params = Route.useSearch()
  const navigate = useNavigate({ from: '/design/' })
  return (
    <DesignWorkbench
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
