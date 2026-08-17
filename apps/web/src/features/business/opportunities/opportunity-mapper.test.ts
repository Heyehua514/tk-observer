/** 商务商机 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapOpportunityRecord,
  serializeOpportunityPayload,
} from './opportunity-mapper'

describe('opportunity mapper', () => {
  it('maps Supabase opportunity rows with joined client names', () => {
    expect(
      mapOpportunityRecord({
        id: 'o1',
        client_id: 'c1',
        clients: { name: '远海品牌' },
        title: '年度赞助',
        amount: 500000,
        stage: 'proposal',
        probability: 30,
        expected_close: null,
        notes: null,
      })
    ).toEqual({
      id: 'o1',
      client: 'c1',
      clientName: '远海品牌',
      title: '年度赞助',
      amount: 500000,
      stage: 'proposal',
      probability: 30,
      expectedClose: '',
      notes: '',
    })
  })

  it('renames client to client_id when writing Supabase rows', () => {
    expect(
      serializeOpportunityPayload({
        client: 'c1',
        title: '年度赞助',
        amount: 500000,
        type: 'other',
        stage: 'contact',
        probability: 10,
        expected_close: '',
        notes: '',
      })
    ).toMatchObject({
      client_id: 'c1',
      title: '年度赞助',
      amount: 500000,
    })
  })
})
