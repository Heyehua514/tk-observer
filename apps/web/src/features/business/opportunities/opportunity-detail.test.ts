import { describe, expect, it } from 'vitest'
import { opportunityDetailPatch } from './opportunity-detail'

describe('opportunityDetailPatch', () => {
  it('updates stage, expected close and notes', () => {
    expect(
      opportunityDetailPatch({
        stage: 'negotiation',
        expectedClose: '2026-08-12',
        notes: ' 下一步约会议 ',
        lostReason: '',
      })
    ).toEqual({
      stage: 'negotiation',
      probability: 60,
      lost_reason: '',
      expected_close: '2026-08-12 00:00:00.000Z',
      notes: '下一步约会议',
    })
  })

  it('requires lost reason when moving to lost', () => {
    expect(() =>
      opportunityDetailPatch({
        stage: 'lost',
        expectedClose: '',
        notes: '',
        lostReason: '',
      })
    ).toThrow('LOST_REASON_REQUIRED')
  })
})
