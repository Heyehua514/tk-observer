import { useEffect } from 'react'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import type { CompanyListParams, CompanyListResult } from '../types'
import { mapCompany } from './company-mapper'

export const companyKeys = {
  all: ['companies'] as const,
  list: (params: CompanyListParams) =>
    [...companyKeys.all, 'list', params] as const,
}

async function fetchCompanies(
  params: CompanyListParams
): Promise<CompanyListResult> {
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
