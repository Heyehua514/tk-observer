import { describe, expect, it } from 'vitest'
import { opportunityStagePatch } from './opportunity-rules'

describe('opportunityStagePatch', () => {
  it('sets deterministic probability for each pipeline stage', () => {
    expect(opportunityStagePatch('negotiation')).toEqual({
      stage: 'negotiation',
      probability: 60,
      lost_reason: '',
    })
    expect(opportunityStagePatch('won')).toEqual({
      stage: 'won',
      probability: 100,
      lost_reason: '',
    })
  })
  it('requires a reason before an opportunity can be lost', () => {
    expect(() => opportunityStagePatch('lost')).toThrow('LOST_REASON_REQUIRED')
    expect(opportunityStagePatch('lost', '预算冻结')).toEqual({
      stage: 'lost',
      probability: 0,
      lost_reason: '预算冻结',
    })
  })
})
