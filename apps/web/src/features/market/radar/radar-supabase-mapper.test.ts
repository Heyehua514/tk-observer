import { describe, expect, it } from 'vitest'
import { mapProductRadarRow, serializeProductRadar } from './radar-supabase-mapper'

describe('radar-supabase-mapper', () => {
  it('correctly maps database row to domain model', () => {
    const row = {
      id: 'r-101',
      title: '无线降噪耳机',
      category: '3C数码',
      region: 'US',
      source_platform: 'tiktok_shop',
      source_url: 'https://tiktok.com/shop/123',
      sales_volume: 8500,
      sales_amount_minor: 17000000,
      currency: 'USD',
      heat_score: 95,
      growth_rate: 180.25,
      tags: ['音质极佳', '超长续航'],
      is_added_to_products: true,
      notes: '测试备注',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-02T00:00:00Z',
    }
    const item = mapProductRadarRow(row)
    expect(item.id).toBe('r-101')
    expect(item.title).toBe('无线降噪耳机')
    expect(item.salesVolume).toBe(8500)
    expect(item.isAddedToProducts).toBe(true)
    expect(item.tags).toEqual(['音质极佳', '超长续航'])
  })

  it('correctly serializes domain model for insertion', () => {
    const serialized = serializeProductRadar({
      title: '便携无叶风扇',
      category: '家居生活',
      region: 'UK',
      sourcePlatform: 'amazon',
      sourceUrl: 'https://amazon.co.uk/dp/456',
      salesVolume: 3200,
      salesAmountMinor: 6400000,
      currency: 'GBP',
      heatScore: 82,
      growthRate: 45.6,
      tags: ['夏日便携'],
      isAddedToProducts: false,
      notes: '英国站测试',
    })
    expect(serialized.title).toBe('便携无叶风扇')
    expect(serialized.source_platform).toBe('amazon')
    expect(serialized.sales_volume).toBe(3200)
    expect(serialized.is_added_to_products).toBe(false)
  })
})
