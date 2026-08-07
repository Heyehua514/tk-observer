import { describe, expect, it } from 'vitest'
import {
  formatCny,
  opportunityCreateInput,
  yuanToFen,
} from './opportunity-amount'

describe('yuanToFen', () => {
  it.each([
    ['10000', 1_000_000],
    ['9999.50', 999_950],
    ['0.01', 1],
    ['0', 0],
  ])('converts RMB yuan %s to integer fen %i', (yuan, fen) => {
    expect(yuanToFen(yuan)).toBe(fen)
  })

  it.each(['', '-1', 'abc', '12.345', '1,000', 'Infinity'])(
    'rejects invalid RMB input %s',
    (value) => {
      expect(yuanToFen(value)).toBeNull()
    }
  )

  it('rejects values that exceed safe integer storage', () => {
    expect(yuanToFen('90071992547410')).toBeNull()
  })
})

describe('formatCny', () => {
  it('formats stored fen as RMB yuan', () => {
    expect(formatCny(1_000_000)).toBe('¥10,000.00')
  })
})

describe('opportunityCreateInput', () => {
  it('builds a PocketBase payload with RMB yuan converted to fen', () => {
    expect(
      opportunityCreateInput({
        title: '日报自动化测试',
        client: 'client-1',
        amount: '10000',
      })
    ).toEqual({
      title: '日报自动化测试',
      client: 'client-1',
      amount: 1_000_000,
    })
  })

  it('returns null when the amount is invalid', () => {
    expect(
      opportunityCreateInput({
        title: '日报自动化测试',
        client: 'client-1',
        amount: '12.345',
      })
    ).toBeNull()
  })

  it.each([
    { title: '', client: 'client-1', amount: '10000' },
    { title: '日报自动化测试', client: '', amount: '10000' },
  ])('returns null when required business fields are empty', (draft) => {
    expect(opportunityCreateInput(draft)).toBeNull()
  })
})
