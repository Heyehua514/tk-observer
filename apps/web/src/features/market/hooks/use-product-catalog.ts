/** 市场工作台选品库数据访问：只读读取已有 products 表。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import { buildProductRows, type ProductRow } from '../components/product-model'

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
