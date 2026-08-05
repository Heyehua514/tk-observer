/**
 * 达人管理列表查询模板。
 * 包含分页、搜索、组合筛选、排序及 PocketBase 实时失效刷新。
 */
import { useEffect } from 'react'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import type { CreatorListParams, CreatorListResult } from '../types'
import { mapCreator } from './creator-mapper'

export const creatorKeys = {
  all: ['creators'] as const,
  list: (params: CreatorListParams) =>
    [...creatorKeys.all, 'list', params] as const,
  detail: (id: string) => [...creatorKeys.all, 'detail', id] as const,
}

async function fetchCreators(
  params: CreatorListParams
): Promise<CreatorListResult> {
  const filters: string[] = []
  const values: Record<string, string> = {}
  if (params.query) {
    filters.push(
      '(nickname ~ {:query} || tiktok_url ~ {:query} || owner ~ {:query})'
    )
    values.query = params.query
  }
  if (params.region !== 'all') {
    filters.push('region = {:region}')
    values.region = params.region
  }
  if (params.status !== 'all') {
    filters.push('cooperation_status = {:status}')
    values.status = params.status
  }

  const page = await pb
    .collection('creators')
    .getList(params.page, params.perPage, {
      filter: filters.length ? pb.filter(filters.join(' && '), values) : '',
      sort: params.sort,
    })
  return { ...page, items: page.items.map(mapCreator) }
}

export function useCreators(params: CreatorListParams) {
  const queryClient = useQueryClient()
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('creators')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      })
      .then((stop) => {
        if (disposed) stop()
        else unsubscribe = stop
      })
    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [queryClient])

  return useQuery({
    queryKey: creatorKeys.list(params),
    queryFn: () => fetchCreators(params),
    placeholderData: keepPreviousData,
  })
}
