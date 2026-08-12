import { describe, expect, it } from 'vitest'
import { financeYuanInput, formatFinanceCny } from './finance-format'

describe('market finance format helpers', () => {
  it('converts RMB yuan input to fen and formats stored fen', () => {
    expect(financeYuanInput('15000')).toBe(1_500_000)
    expect(financeYuanInput('1.234')).toBeNull()
    expect(formatFinanceCny(1_500_000)).toBe('¥15,000.00')
  })
})
