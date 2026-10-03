/** 爆品雷达数据与 Supabase 数据表双向映射 */
import type { Region } from '@/types/commerce'
import type { ProductRadarItem, SourcePlatform } from './types'

export type ProductRadarRow = {
  id?: string
  title?: string | null
  category?: string | null
  region?: string | null
  source_platform?: string | null
  source_url?: string | null
  sales_volume?: number | null
  sales_amount_minor?: number | null
  currency?: string | null
  heat_score?: number | null
  growth_rate?: number | null
  tags?: string[] | null
  is_added_to_products?: boolean | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export function mapProductRadarRow(row: ProductRadarRow): ProductRadarItem {
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    category: String(row.category || '通用'),
    region: (row.region as Region) || 'US',
    sourcePlatform: (row.source_platform as SourcePlatform) || 'tiktok_shop',
    sourceUrl: String(row.source_url || ''),
    salesVolume: Number(row.sales_volume || 0),
    salesAmountMinor: Number(row.sales_amount_minor || 0),
    currency: String(row.currency || 'USD'),
    heatScore: Number(row.heat_score || 50),
    growthRate: Number(row.growth_rate || 0.0),
    tags: Array.isArray(row.tags) ? row.tags : [],
    isAddedToProducts: Boolean(row.is_added_to_products),
    notes: String(row.notes || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  }
}

export function serializeProductRadar(item: Omit<ProductRadarItem, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    title: item.title,
    category: item.category,
    region: item.region,
    source_platform: item.sourcePlatform,
    source_url: item.sourceUrl,
    sales_volume: item.salesVolume,
    sales_amount_minor: item.salesAmountMinor,
    currency: item.currency,
    heat_score: item.heatScore,
    growth_rate: item.growthRate,
    tags: item.tags,
    is_added_to_products: item.isAddedToProducts,
    notes: item.notes,
  }
}
