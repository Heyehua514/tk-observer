/**
 * 通用列表搜索状态 hook。
 * 把关键词、页码和筛选条件组织成稳定的 TanStack Query 参数。
 */
import { useMemo } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export type SearchParams<TFilters extends Record<string, string>> = {
  query: string
  page: number
  perPage: number
  sort: string
  filters: TFilters
}

export function useSearch<TFilters extends Record<string, string>>(
  params: SearchParams<TFilters>
) {
  const debouncedQuery = useDebouncedValue(params.query, 300)
  return useMemo(
    () => ({ ...params, query: debouncedQuery }),
    [debouncedQuery, params]
  )
}
