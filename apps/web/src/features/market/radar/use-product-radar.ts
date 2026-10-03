/** 爆品雷达数据查询与变更 Hooks（含加入选品库联动） */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { useCreateProduct } from '../hooks/use-product-crud'
import { mapProductRadarRow, serializeProductRadar, type ProductRadarRow } from './radar-supabase-mapper'
import type { ProductRadarFilterParams, ProductRadarItem } from './types'
import { filterAndSortRadarItems } from './radar-model'

export const productRadarKeys = {
  all: ['market', 'product_radars'] as const,
  list: (params?: ProductRadarFilterParams) => [...productRadarKeys.all, 'list', params] as const,
}

// 模拟种子数据，确保即使本地 Supabase 表空时也能完整演示交互与导出
const fallbackRadarItems: ProductRadarItem[] = [
  {
    id: 'radar-sample-1',
    title: '智能磁吸车载手机支架（自动感应开合）',
    category: '3C数码',
    region: 'US',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/1001',
    salesVolume: 28400,
    salesAmountMinor: 56771600, // $567,716.00
    currency: 'USD',
    heatScore: 94,
    growthRate: 182.4,
    tags: ['汽车好物', '爆款推荐', '高转化'],
    isAddedToProducts: false,
    notes: '美区带货短视频互动率极高，日单量破千',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-03T08:00:00Z',
  },
  {
    id: 'radar-sample-2',
    title: '草本生姜防脱洗发水（控油蓬松）',
    category: '美妆个护',
    region: 'UK',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/1002',
    salesVolume: 15300,
    salesAmountMinor: 22934700,
    currency: 'GBP',
    heatScore: 88,
    growthRate: 115.0,
    tags: ['护发黑科技', '纯植物', '英区热卖'],
    isAddedToProducts: false,
    notes: '英国小店达人短视频密集带货，复购意愿强',
    createdAt: '2026-10-01T15:00:00Z',
    updatedAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'radar-sample-3',
    title: '折叠收纳便携旅行双肩包（防泼水轻量）',
    category: '运动户外',
    region: 'TH',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/1003',
    salesVolume: 34200,
    salesAmountMinor: 68400000,
    currency: 'THB',
    heatScore: 82,
    growthRate: 78.5,
    tags: ['旅行必备', '防水防刮', '东南亚爆款'],
    isAddedToProducts: true,
    notes: '泰区直播间热销，单场爆单',
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-03T07:00:00Z',
  },
  {
    id: 'radar-sample-4',
    title: '不锈钢多功能快速切菜刨丝神器',
    category: '家居生活',
    region: 'ID',
    sourcePlatform: 'shopee',
    sourceUrl: 'https://shopee.co.id/item/1004',
    salesVolume: 42100,
    salesAmountMinor: 126300000,
    currency: 'IDR',
    heatScore: 76,
    growthRate: 46.2,
    tags: ['厨房神器', '主妇力荐'],
    isAddedToProducts: false,
    notes: '印尼长青居家品类，日均走量稳定',
    createdAt: '2026-10-02T11:00:00Z',
    updatedAt: '2026-10-03T06:00:00Z',
  },
]

export function useProductRadarList(filterParams?: ProductRadarFilterParams) {
  return useQuery({
    queryKey: productRadarKeys.list(filterParams),
    queryFn: async (): Promise<ProductRadarItem[]> => {
      try {
        const client = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client as any)
          .from('product_radars')
          .select('*')
          .is('deleted_at', null)
          .order('heat_score', { ascending: false })

        if (error || !data || data.length === 0) {
          return filterAndSortRadarItems(fallbackRadarItems, filterParams || {})
        }

        const items = (data as ProductRadarRow[]).map(mapProductRadarRow)
        return filterAndSortRadarItems(items, filterParams || {})
      } catch {
        return filterAndSortRadarItems(fallbackRadarItems, filterParams || {})
      }
    },
  })
}

export function useCreateRadarItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: Omit<ProductRadarItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const client = getSupabaseClient()
      const payload = serializeProductRadar(item)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client as any)
        .from('product_radars')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      return mapProductRadarRow(data as ProductRadarRow)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productRadarKeys.all })
    },
  })
}

/** 一键将爆品雷达商品导入选品库 */
export function useAddRadarToProductCatalog() {
  const queryClient = useQueryClient()
  const createProduct = useCreateProduct()

  return useMutation({
    mutationFn: async (radarItem: ProductRadarItem) => {
      // 1. 在选品库创建商品（预估价格按雷达均价计算，以元为单位字符串传入）
      const avgPriceYuan =
        radarItem.salesVolume > 0
          ? (radarItem.salesAmountMinor / radarItem.salesVolume / 100).toFixed(2)
          : '19.99'
      // 采购成本初算按售价约 30%
      const estimatedCostYuan = (Number(avgPriceYuan) * 0.3).toFixed(2)

      await createProduct.mutateAsync({
        name: radarItem.title,
        category: radarItem.category,
        priceYuan: avgPriceYuan,
        costYuan: estimatedCostYuan,
        currency: radarItem.currency,
        costCurrency: 'CNY',
        exchangeRate: radarItem.currency === 'USD' ? 7.2 : 1.0,
        region: radarItem.region,
        status: 'draft',
      })

      // 2. 标记雷达商品为已加入选品库
      try {
        const client = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any)
          .from('product_radars')
          .update({ is_added_to_products: true })
          .eq('id', radarItem.id)
      } catch {
        // 软降级
      }

      return radarItem.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productRadarKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['market', 'products'] })
    },
  })
}
