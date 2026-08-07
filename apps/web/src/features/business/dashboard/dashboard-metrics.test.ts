import { describe, expect, it } from 'vitest'
import { calculateBusinessDashboard } from './dashboard-metrics'

const now = new Date('2026-08-06T04:00:00Z')

describe('calculateBusinessDashboard', () => {
  it('calculates current operating metrics from real record dates and stages', () => {
    const result = calculateBusinessDashboard(
      {
        clients: [
          {
            id: 'c1',
            name: '远海品牌',
            created: '2026-08-01T02:00:00Z',
            updated: '2026-08-05T02:00:00Z',
          },
          {
            id: 'c2',
            name: '星河 MCN',
            created: '2026-07-31T02:00:00Z',
            updated: '2026-08-04T02:00:00Z',
          },
        ],
        opportunities: [
          {
            id: 'o1',
            clientName: '远海品牌',
            title: 'Q3 渠道合作',
            amount: 120000,
            stage: 'proposal',
            probability: 30,
            expectedClose: '2026-08-05T08:00:00Z',
            updated: '2026-08-05T03:00:00Z',
          },
          {
            id: 'o2',
            clientName: '星河 MCN',
            title: '达人联合投放',
            amount: 80000,
            stage: 'contract',
            probability: 80,
            expectedClose: '2026-08-10T08:00:00Z',
            updated: '2026-08-04T03:00:00Z',
          },
          {
            id: 'o3',
            clientName: '远海品牌',
            title: '旧项目',
            amount: 50000,
            stage: 'won',
            probability: 100,
            expectedClose: '2026-08-01T08:00:00Z',
            updated: '2026-08-03T03:00:00Z',
          },
        ],
        orders: [
          {
            id: 'r1',
            title: '新品测评',
            clientName: '远海品牌',
            amount: 36000,
            status: 'published',
            publishDate: '2026-08-03T00:00:00Z',
            updated: '2026-08-03T02:00:00Z',
          },
          {
            id: 'r2',
            title: '七月商单',
            clientName: '星河 MCN',
            amount: 26000,
            status: 'published',
            publishDate: '2026-07-28T00:00:00Z',
            updated: '2026-07-28T02:00:00Z',
          },
        ],
        socialPlans: [
          {
            id: 's1',
            content: '品牌增长案例',
            date: '2026-08-07T00:00:00Z',
            status: 'planned',
          },
        ],
      },
      now
    )

    expect(result.metrics).toEqual({
      totalClients: 2,
      newClientsThisMonth: 1,
      activeOpportunities: 2,
      activeOpportunityAmount: 200000,
      publishedOrdersThisMonth: 1,
      comparison: null,
    })
    expect(result.actions.map((item) => [item.id, item.urgency])).toEqual([
      ['o1', 'overdue'],
      ['o2', 'due_soon'],
    ])
  })

  it('keeps undated opportunities active without creating a false deadline action', () => {
    const result = calculateBusinessDashboard(
      {
        clients: [],
        opportunities: [
          {
            id: 'o1',
            clientName: '测试客户',
            title: '未定档商机',
            amount: 10000,
            stage: 'contact',
            probability: 10,
            expectedClose: '',
            updated: '2026-08-05T03:00:00Z',
          },
        ],
        orders: [],
        socialPlans: [],
      },
      now
    )

    expect(result.metrics.activeOpportunities).toBe(1)
    expect(result.actions).toEqual([])
  })
})
