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
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { createSupabasePageQuery } from '@/lib/supabase-table'
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
  if (getDataProvider() === 'supabase') {
    const sort = params.sort
      .replace('created', 'created_at')
      .replace('updated', 'updated_at')
    const filters: Parameters<typeof createSupabasePageQuery>[0]['filters'] = [
      { kind: 'is', column: 'deleted_at', value: null },
    ]
    if (params.region !== 'all') {
      filters.push({ kind: 'eq', column: 'region', value: params.region })
    }
    if (params.status !== 'all') {
      filters.push({
        kind: 'eq',
        column: 'cooperation_status',
        value: params.status,
      })
    }
    if (params.query) {
      const escaped = params.query.replace(/%/g, '\\%').replace(/,/g, '\\,')
      filters.push({
        kind: 'or',
        expression: `nickname.ilike.%${escaped}%,tiktok_url.ilike.%${escaped}%,owner_name.ilike.%${escaped}%`,
      })
    }
    return createSupabasePageQuery({
      table: 'creators',
      page: params.page,
      perPage: params.perPage,
      sort: sort.startsWith('-')
        ? `${sort.slice(1)}.desc`
        : `${sort}.asc`,
      filters,
      mapRow: mapCreator,
    })
  }

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
    if (getDataProvider() === 'supabase') return
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
