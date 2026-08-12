import { describe, expect, it } from 'vitest'
import { emptyOrderFilters, filterOrders } from './order-filters'

const orders = [
  {
    title: '新品测评',
    clientName: '远海品牌',
    creatorName: '阿杰',
    status: 'published',
    platform: 'tiktok',
    contentType: 'unboxing',
  },
  {
    title: '直播带货',
    clientName: '飞轮ERP',
    creatorName: '小林',
    status: 'confirmed',
    platform: 'wechat_channels',
    contentType: 'live_commerce',
  },
]

describe('filterOrders', () => {
  it('filters by query, status, platform and content type', () => {
    expect(
      filterOrders(orders, {
        query: '飞轮',
        status: 'confirmed',
        platform: 'wechat_channels',
        contentType: 'live_commerce',
      }).map((order) => order.title)
    ).toEqual(['直播带货'])
  })

  it('keeps all rows when filters are empty', () => {
    expect(filterOrders(orders, emptyOrderFilters)).toHaveLength(2)
  })
})
