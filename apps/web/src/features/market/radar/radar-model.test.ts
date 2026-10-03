import { describe, expect, it } from 'vitest'
import {
  exportRadarItemsToCsv,
  exportRadarItemsToJson,
  filterAndSortRadarItems,
  getRadarHeatGrade,
} from './radar-model'
import type { ProductRadarItem } from './types'

const mockItems: ProductRadarItem[] = [
  {
    id: 'radar-1',
    title: '便携无叶挂脖风扇',
    category: '3C数码',
    region: 'US',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/1',
    salesVolume: 12500,
    salesAmountMinor: 24987500, // $249,875.00
    currency: 'USD',
    heatScore: 92,
    growthRate: 154.5,
    tags: ['夏季热卖', '降温黑科技'],
    isAddedToProducts: true,
    notes: '爆款出海标杆',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'radar-2',
    title: '植物精油保湿身体乳',
    category: '美妆个护',
    region: 'UK',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/2',
    salesVolume: 6200,
    salesAmountMinor: 9300000,
    currency: 'GBP',
    heatScore: 78,
    growthRate: 68.2,
    tags: ['秋冬保湿', '纯植物'],
    isAddedToProducts: false,
    notes: '英区达人带货增长迅速',
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'radar-3',
    title: '多功能厨房料理切菜机',
    category: '家居生活',
    region: 'TH',
    sourcePlatform: 'shopee',
    sourceUrl: 'https://shopee.co.th/product/3',
    salesVolume: 3200,
    salesAmountMinor: 48000000,
    currency: 'THB',
    heatScore: 48,
    growthRate: 22.0,
    tags: ['厨房神器'],
    isAddedToProducts: false,
    notes: '东南亚长青品',
    createdAt: '2026-10-02T12:00:00Z',
    updatedAt: '2026-10-03T09:00:00Z',
  },
]

describe('radar-model logic and export', () => {
  it('correctly categorizes heat grade', () => {
    expect(getRadarHeatGrade(95).level).toBe('explosive')
    expect(getRadarHeatGrade(75).level).toBe('hot')
    expect(getRadarHeatGrade(55).level).toBe('warm')
    expect(getRadarHeatGrade(30).level).toBe('normal')
  })

  it('filters by region and category', () => {
    const result = filterAndSortRadarItems(mockItems, {
      region: 'US',
      category: '3C数码',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('radar-1')
  })

  it('filters by minimum heat score', () => {
    const result = filterAndSortRadarItems(mockItems, {
      minHeatScore: 70,
    })
    expect(result).toHaveLength(2)
  })

  it('sorts by growthRate descending', () => {
    const result = filterAndSortRadarItems(mockItems, {
      sortField: 'growthRate',
      sortDirection: 'desc',
    })
    expect(result[0].id).toBe('radar-1')
    expect(result[1].id).toBe('radar-2')
    expect(result[2].id).toBe('radar-3')
  })

  it('exports valid CSV with BOM and headers', () => {
    const csv = exportRadarItemsToCsv(mockItems)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"商品名称"')
    expect(csv).toContain('"便携无叶挂脖风扇"')
    expect(csv).toContain('12500')
  })

  it('exports valid JSON structure', () => {
    const jsonStr = exportRadarItemsToJson(mockItems)
    const parsed = JSON.parse(jsonStr)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(3)
    expect(parsed[0].title).toBe('便携无叶挂脖风扇')
  })
})
