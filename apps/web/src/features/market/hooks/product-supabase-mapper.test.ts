/** 市场选品库 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { mapSupabaseProduct } from './product-supabase-mapper'

describe('mapSupabaseProduct', () => {
  it('maps Supabase products into the existing product row source model', () => {
    expect(
      mapSupabaseProduct({
        id: 'product-1',
        name: '蓝牙音箱',
        category: 'electronics',
        price_minor: 19900,
        cost_minor: 9200,
        currency: 'CNY',
        status: 'active',
        region: 'US',
      })
    ).toEqual({
      id: 'product-1',
      name: '蓝牙音箱',
      category: 'electronics',
      priceMinor: 19900,
      costMinor: 9200,
      currency: 'CNY',
      status: 'active',
      region: 'US',
    })
  })
})
