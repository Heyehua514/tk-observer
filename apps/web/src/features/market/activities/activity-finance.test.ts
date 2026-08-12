import { describe, expect, it } from 'vitest'
import { activityFinanceAmountInput } from './activity-finance'

describe('activityFinanceAmountInput', () => {
  it('stores RMB yuan input as integer fen', () => {
    expect(activityFinanceAmountInput('8000')).toBe(800000)
    expect(activityFinanceAmountInput('99.99')).toBe(9999)
    expect(activityFinanceAmountInput('1.999')).toBeNull()
  })
})
