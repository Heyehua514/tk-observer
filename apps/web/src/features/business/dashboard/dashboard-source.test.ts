/** 商务驾驶舱数据源映射自检；兼容 Supabase/PocketBase 行结构。 */
import { describe, expect, it } from 'vitest'
import {
  mapDashboardClient,
  mapDashboardOpportunity,
  mapDashboardOrder,
  mapDashboardSocialPlan,
} from './dashboard-source'

describe('business dashboard source mappers', () => {
  it('maps Supabase joined rows into dashboard data', () => {
    expect(
      mapDashboardOpportunity({
        id: 'o1',
        clients: { name: '远海品牌' },
        title: '年度赞助',
        amount: 100000,
        stage: 'proposal',
        probability: 30,
        expected_close: null,
        updated_at: '2026-08-12T00:00:00Z',
      })
    ).toMatchObject({
      clientName: '远海品牌',
      expectedClose: '',
      updated: '2026-08-12T00:00:00Z',
    })
  })

  it('keeps client, order and social dates stable', () => {
    expect(
      mapDashboardClient({
        id: 'c1',
        name: '客户',
        created_at: 'a',
        updated_at: 'b',
      })
    ).toEqual({
      id: 'c1',
      name: '客户',
      created: 'a',
      updated: 'b',
    })
    expect(
      mapDashboardOrder({
        id: 'co1',
        title: '商单',
        clients: {},
        publish_date: null,
      })
    ).toMatchObject({
      clientName: '未知客户',
      publishDate: '',
    })
    expect(
      mapDashboardSocialPlan({
        id: 's1',
        content: '内容',
        date: 'd',
        status: 'planned',
      })
    ).toEqual({
      id: 's1',
      content: '内容',
      date: 'd',
      status: 'planned',
    })
  })
})
