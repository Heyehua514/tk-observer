/** formatMoney 人民币口径回归：金额按分存储，展示统一为 CNY，不允许静默落到 USD。 */
import { describe, expect, it } from 'vitest'
import { formatBeijingTime, formatMoney } from './format'

describe('formatMoney', () => {
  it('默认按人民币展示（分 → 元）', () => {
    expect(formatMoney(123456)).toBe('¥1,234.56')
  })

  it('显式 USD 仍可切换（跨国 GMV 场景由调用方明确传入）', () => {
    expect(formatMoney(123456, 'USD')).toBe('US$1,234.56')
  })
})

describe('formatBeijingTime', () => {
  it('按北京时间格式化', () => {
    const result = formatBeijingTime('2026-08-14T04:00:00.000Z')
    expect(result).toContain('2026年8月14日')
    expect(result).toContain('12:00')
  })
})
