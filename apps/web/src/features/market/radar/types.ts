/** 爆品雷达领域模型与查询类型定义 */
import type { Region } from '@/types/commerce'

export type SourcePlatform = 'tiktok_shop' | 'amazon' | 'shopee' | 'lazada' | 'other'

export interface ProductRadarItem {
  id: string
  title: string
  category: string
  region: Region
  sourcePlatform: SourcePlatform
  sourceUrl: string
  salesVolume: number
  salesAmountMinor: number
  currency: string
  heatScore: number
  growthRate: number
  tags: string[]
  isAddedToProducts: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProductRadarSortField = 'heatScore' | 'salesVolume' | 'growthRate' | 'salesAmountMinor'

export interface ProductRadarFilterParams {
  query?: string
  region?: Region | 'all'
  category?: string | 'all'
  sourcePlatform?: SourcePlatform | 'all'
  minHeatScore?: number
  sortField?: ProductRadarSortField
  sortDirection?: 'asc' | 'desc'
  tags?: string[]
}
