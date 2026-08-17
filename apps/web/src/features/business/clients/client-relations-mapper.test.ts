/** 客户详情关联查询 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapClientOrderRelation,
  mapClientOpportunityRelation,
} from './use-client-relations'

describe('client relation mappers', () => {
  it('maps Supabase foreign keys into existing relation models', () => {
    expect(
      mapClientOpportunityRelation({
        id: 'opp-1',
        client_id: 'client-1',
        title: '活动赞助',
        amount: 100000,
        stage: 'proposal',
        probability: 30,
      })
    ).toMatchObject({ client: 'client-1', title: '活动赞助' })

    expect(
      mapClientOrderRelation({
        id: 'order-1',
        client_id: 'client-1',
        title: '达人测评',
        amount: 50000,
        status: 'published',
        publish_date: null,
      })
    ).toMatchObject({ client: 'client-1', publishDate: '' })
  })
})
