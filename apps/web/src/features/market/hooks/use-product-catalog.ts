/** 市场工作台选品库数据访问，Supabase-first，PocketBase 保留回退。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { buildProductRows, type ProductRow } from '../components/product-model'
import { mapSupabaseProduct } from './product-supabase-mapper'

export const productCatalogKeys = {
  all: ['market', 'products'] as const,
}

type ProductRecord = {
  id: string
  name: string
  category: string
  priceMinor: number
  costMinor: number
  currency: string
  status: string
  region: string
}

const escapeSearch = (value: string) =>
  value.trim().replace(/[%_,]/g, '').slice(0, 80)

const mapProduct = (record: RecordModel): ProductRecord => ({
  id: record.id,
  name: String(record.name || ''),
  category: String(record.category || ''),
  priceMinor: Number(record.price_minor || 0),
  costMinor: Number(record.cost_minor || 0),
  currency: String(record.currency || 'CNY'),
  status: String(record.status || ''),
  region: String(record.region || ''),
})

export function useProductCatalog(query = '') {
  return useQuery({
    queryKey: [...productCatalogKeys.all, query],
    queryFn: async (): Promise<ProductRow[]> => {
      if (getDataProvider() === 'supabase') {
        let request = getSupabaseClient()
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        const keyword = escapeSearch(query)
        if (keyword) {
          request = request.or(
            `name.ilike.%${keyword}%,category.ilike.%${keyword}%,region.ilike.%${keyword}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        return buildProductRows((data || []).map(mapSupabaseProduct))
      }
      const records = await pb.collection('products').getFullList({
        sort: '-updated',
        filter: query
          ? pb.filter(
              'name ~ {:query} || category ~ {:query} || region ~ {:query}',
              {
                query,
              }
            )
          : '',
      })
      return buildProductRows(records.map(mapProduct))
    },
  })
}
