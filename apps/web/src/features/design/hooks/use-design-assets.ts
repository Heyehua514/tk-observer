/** 设计素材列表查询，Supabase-first，PocketBase 保留回退。 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { resolveStorageUrls } from '@/lib/storage-url'
import { getSupabaseClient } from '@/lib/supabase'
import type { DesignAssetListParams } from '../types'
import { mapDesignAsset } from './design-asset-mapper'
import {
  mapSupabaseDesignAsset,
  toSupabaseDesignAssetSort,
} from './design-supabase-mapper'

export const designAssetKeys = {
  all: ['design-assets'] as const,
  list: () => [...designAssetKeys.all, 'list'] as const,
}

export function useDesignAssets(params: DesignAssetListParams) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') return
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('design_assets')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({ queryKey: designAssetKeys.all })
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
    queryKey: [...designAssetKeys.list(), params],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const mappedSort = toSupabaseDesignAssetSort(params.sort)
        const sort = mappedSort.startsWith('-')
          ? { column: mappedSort.slice(1), ascending: false }
          : { column: mappedSort, ascending: true }
        let request = supabase
          .from('design_assets')
          .select('*')
          .is('deleted_at', null)
          .order(sort.column, { ascending: sort.ascending })
        if (params.status !== 'all') {
          request = request.eq('status', params.status)
        }
        if (params.region !== 'all') {
          request = request.eq('region', params.region)
        }
        if (params.query) {
          const escaped = params.query.replace(/%/g, '\\%').replace(/,/g, '\\,')
          request = request.or(
            `file_name.ilike.%${escaped}%,dimensions.ilike.%${escaped}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        const assets = (data || []).map(mapSupabaseDesignAsset)
        const urls = await resolveStorageUrls(
          'design-assets',
          assets.map((asset) => asset.file)
        )
        return assets.map((asset) =>
          asset.file && urls[asset.file]
            ? { ...asset, fileUrl: urls[asset.file] }
            : asset
        )
      }
      const filters: string[] = []
      const values: Record<string, string> = {}
      if (params.query) {
        filters.push('(file_name ~ {:query} || dimensions ~ {:query})')
        values.query = params.query
      }
      if (params.status !== 'all') {
        filters.push('status = {:status}')
        values.status = params.status
      }
      if (params.region !== 'all') {
        filters.push('region = {:region}')
        values.region = params.region
      }
      const records = await pb.collection('design_assets').getFullList({
        filter: filters.length ? pb.filter(filters.join(' && '), values) : '',
        sort: params.sort,
      })
      return records.map(mapDesignAsset)
    },
  })
}
