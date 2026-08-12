import { describe, expect, it } from 'vitest'
import { buildProductRows } from './product-model'

describe('buildProductRows', () => {
  it('maps product records into readable rows', () => {
    expect(
      buildProductRows([
        {
          id: 'p1',
          name: '海景蓝牙音箱',
          category: 'electronics',
          priceMinor: 19900,
          costMinor: 9200,
          currency: 'CNY',
          status: 'active',
          region: 'US',
        },
      ])
    ).toEqual([
      {
        id: 'p1',
        name: '海景蓝牙音箱',
        category: 'electronics',
        priceMinor: 19900,
        costMinor: 9200,
        marginMinor: 10700,
        marginRate: 53.8,
        currency: 'CNY',
        status: 'active',
        region: 'US',
      },
    ])
  })
})
