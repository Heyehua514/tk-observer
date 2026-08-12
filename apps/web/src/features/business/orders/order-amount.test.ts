import { describe, expect, it } from 'vitest'
import { formatOrderAmount, orderAmountInput } from './order-amount'

describe('order amount helpers', () => {
  it('stores RMB yuan input as integer fen', () => {
    expect(orderAmountInput('10000')).toBe(1_000_000)
    expect(orderAmountInput('199.99')).toBe(19_999)
    expect(orderAmountInput('1.999')).toBeNull()
  })

  it('formats stored fen as CNY', () => {
    expect(formatOrderAmount(1_000_000)).toBe('¥10,000.00')
  })
})
