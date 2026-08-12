import { describe, expect, it } from 'vitest'
import { emptyClientFilters, filterClients } from './client-filters'
import type { Client } from './types'

const clients: Client[] = [
  {
    id: 'c1',
    name: '远海品牌',
    contactName: '张经理',
    contactPhone: '',
    contactWechat: '',
    company: '远海科技',
    industry: 'brand',
    source: 'event',
    level: 'A',
    notes: '',
    updated: '',
  },
  {
    id: 'c2',
    name: '飞轮ERP',
    contactName: '王总',
    contactPhone: '',
    contactWechat: '',
    company: '飞轮软件',
    industry: 'erp',
    source: 'outbound',
    level: 'S',
    notes: '',
    updated: '',
  },
]

describe('filterClients', () => {
  it('filters clients by query, industry, source and level', () => {
    expect(
      filterClients(clients, {
        ...emptyClientFilters,
        query: '飞轮',
        industry: 'erp',
        source: 'outbound',
        level: 'S',
      }).map((client) => client.id)
    ).toEqual(['c2'])
  })

  it('keeps all clients when filters are empty', () => {
    expect(filterClients(clients, emptyClientFilters)).toHaveLength(2)
  })
})
