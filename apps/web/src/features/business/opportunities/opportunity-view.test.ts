import { describe, expect, it } from 'vitest'
import { opportunityDueText } from './opportunity-view'

describe('opportunityDueText', () => {
  it('shows date-only expected close or an explicit fallback', () => {
    expect(opportunityDueText('2026-08-12 00:00:00.000Z')).toBe('2026-08-12')
    expect(opportunityDueText('')).toBe('未设置预计成交日')
  })
})
