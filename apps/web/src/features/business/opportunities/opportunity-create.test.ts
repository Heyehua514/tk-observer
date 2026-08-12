import { describe, expect, it } from 'vitest'
import { opportunityCreatePayload } from './opportunity-create'

describe('opportunityCreatePayload', () => {
  it('serializes expected close and notes with the initial stage patch', () => {
    expect(
      opportunityCreatePayload({
        title: ' Q4 活动赞助 ',
        client: 'client-1',
        amount: '10000',
        expectedClose: '2026-08-12',
        notes: ' 重点客户 ',
      })
    ).toEqual({
      title: 'Q4 活动赞助',
      client: 'client-1',
      amount: 1_000_000,
      type: 'other',
      expected_close: '2026-08-12 00:00:00.000Z',
      notes: '重点客户',
      stage: 'contact',
      probability: 10,
      lost_reason: '',
    })
  })

  it('rejects incomplete drafts', () => {
    expect(
      opportunityCreatePayload({
        title: '',
        client: 'client-1',
        amount: '100',
        expectedClose: '',
        notes: '',
      })
    ).toBeNull()
  })
})
