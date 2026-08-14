/** Supabase 分页查询包装；保持前端 ListResult 语义不变。 */
import { getSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

type PublicTables = Database['public']['Tables']

type SupabasePageFilter =
  | { kind: 'eq'; column: string; value: string | number | boolean }
  | { kind: 'is'; column: string; value: null }
  | { kind: 'gte'; column: string; value: string | number }
  | { kind: 'lte'; column: string; value: string | number }
  | { kind: 'or'; expression: string }

export type SupabasePageQueryInput<T> = {
  table: keyof PublicTables
  page: number
  perPage: number
  sort: string
  filters?: SupabasePageFilter[]
  mapRow: (row: Record<string, unknown>) => T
}

export async function createSupabasePageQuery<T>({
  table,
  page,
  perPage,
  sort,
  filters = [],
  mapRow,
}: SupabasePageQueryInput<T>) {
  const supabase = getSupabaseClient()
  const [column, direction] = sort.split('.')
  const from = Math.max((page - 1) * perPage, 0)
  const to = from + perPage - 1
  let query = supabase.from(table).select('*', { count: 'exact' })
  for (const filter of filters) {
    if (filter.kind === 'eq') query = query.eq(filter.column, filter.value)
    if (filter.kind === 'is') query = query.is(filter.column, filter.value)
    if (filter.kind === 'gte') query = query.gte(filter.column, filter.value)
    if (filter.kind === 'lte') query = query.lte(filter.column, filter.value)
    if (filter.kind === 'or') query = query.or(filter.expression)
  }
  // 业务表统一软删除：分页列表只返回未删除行。当前所有使用该函数的表均含 deleted_at。
  query = query.is('deleted_at', null)
  const sorted = query.order(column, {
    ascending: direction !== 'desc',
  })
  const { data, count, error } = await sorted.range(from, to)
  if (error) throw error
  const totalItems = count || 0
  const totalPages = Math.max(Math.ceil(totalItems / perPage), 1)
  return {
    page,
    perPage,
    totalItems,
    totalPages,
    items: (data || []).map((row) => mapRow(row as Record<string, unknown>)),
  }
}
