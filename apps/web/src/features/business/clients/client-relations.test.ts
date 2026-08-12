import { describe, expect, it } from 'vitest'
import { buildClientRelations } from './client-relations'

describe('buildClientRelations', () => {
  it('keeps only opportunities and orders owned by the selected client', () => {
    const result = buildClientRelations(
      'client-1',
      [
        {
          id: 'o1',
          client: 'client-1',
          title: 'Q3 商机',
          amount: 100000,
          stage: 'proposal',
          probability: 30,
        },
        {
          id: 'o2',
          client: 'client-2',
          title: '其他商机',
          amount: 200000,
          stage: 'contact',
          probability: 10,
        },
      ],
      [
        {
          id: 'r1',
          client: 'client-1',
          title: '达人测评',
          amount: 50000,
          status: 'published',
          publishDate: '2026-08-12',
        },
      ]
    )

    expect(result.opportunities.map((item) => item.id)).toEqual(['o1'])
    expect(result.orders.map((item) => item.id)).toEqual(['r1'])
  })
})
