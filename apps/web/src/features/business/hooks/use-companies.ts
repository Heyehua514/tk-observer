import { useEffect } from 'react'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CompanyListParams, CompanyListResult } from '../types'
import { mapCompany } from './company-mapper'
import { mapSupabaseCompany } from './company-supabase-mapper'

export const companyKeys = {
  all: ['companies'] as const,
  list: (params: CompanyListParams) =>
    [...companyKeys.all, 'list', params] as const,
}

async function fetchCompanies(
  params: CompanyListParams
): Promise<CompanyListResult> {
  if (getDataProvider() === 'supabase') {
    let request = getSupabaseClient()
      .from('companies')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .range(
        (params.page - 1) * params.perPage,
        params.page * params.perPage - 1
      )
    if (params.query.trim()) {
      const query = params.query.trim().replace(/[%_,]/g, '').slice(0, 80)
      if (query) {
        request = request.or(
          `company_name.ilike.%${query}%,contact_name.ilike.%${query}%,contact_email.ilike.%${query}%`
        )
      }
    }
    if (params.region !== 'all') request = request.eq('region', params.region)
    if (params.kind !== 'all') request = request.eq('kind', params.kind)
    const ascending = !params.sort.startsWith('-')
    const column = params.sort.replace('-', '')
    const { data, error, count } = await request.order(column, { ascending })
    if (error) throw error
    const totalItems = count || 0
    return {
      page: params.page,
      perPage: params.perPage,
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / params.perPage), 1),
      items: (data || []).map(mapSupabaseCompany),
    }
  }
  const filters: string[] = []
  const values: Record<string, string> = {}
  if (params.query) {
    filters.push(
      '(company_name ~ {:query} || contact_name ~ {:query} || contact_email ~ {:query})'
    )
    values.query = params.query
  }
  if (params.region !== 'all') {
    filters.push('region = {:region}')
    values.region = params.region
  }
  if (params.kind !== 'all') {
    filters.push('kind = {:kind}')
    values.kind = params.kind
  }
  const page = await pb
    .collection('companies')
    .getList(params.page, params.perPage, {
      filter: filters.length ? pb.filter(filters.join(' && '), values) : '',
      sort: params.sort,
    })
  return { ...page, items: page.items.map(mapCompany) }
}

export function useCompanies(params: CompanyListParams) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') {
      const channel = getSupabaseClient()
        .channel('companies')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          () => {
            void queryClient.invalidateQueries({ queryKey: companyKeys.all })
          }
        )
        .subscribe()
      return () => {
        void getSupabaseClient().removeChannel(channel)
      }
    }
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('companies')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({ queryKey: companyKeys.all })
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
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    placeholderData: keepPreviousData,
  })
}
