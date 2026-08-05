/**
 * 通用列表搜索状态 hook。
 * 把关键词、页码和筛选条件组织成稳定的 TanStack Query 参数。
 */
import { useMemo } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export function useSearch<TParams extends { query: string }>(params: TParams) {
  const debouncedQuery = useDebouncedValue(params.query, 300)
  return useMemo(
    (): TParams => ({ ...params, query: debouncedQuery }),
    [debouncedQuery, params]
  )
}
