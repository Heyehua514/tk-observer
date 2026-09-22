import { describe, expect, it } from 'vitest'
import {
  buildProductRows,
  calculateProductMargin,
  convertToCnyMinor,
  formatCurrency,
  getBenchmarkExchangeRate,
} from './product-model'

describe('product-model currency and exchange rates', () => {
  it('returns standard benchmark exchange rates', () => {
    expect(getBenchmarkExchangeRate('USD')).toBe(7.20)
    expect(getBenchmarkExchangeRate('GBP')).toBe(9.15)
    expect(getBenchmarkExchangeRate('CNY')).toBe(1.0)
    expect(getBenchmarkExchangeRate('UNKNOWN')).toBe(1.0)
  })

  it('converts minor amounts to CNY equivalent correctly', () => {
    // 1000 cents ($10.00) * 7.2 = 7200 cents (¥72.00)
    expect(convertToCnyMinor(1000, 'USD', 7.20)).toBe(7200)
    // CNY returns identical amount
    expect(convertToCnyMinor(5000, 'CNY')).toBe(5000)
  })

  it('formats currency amounts with proper symbols', () => {
    expect(formatCurrency(2999, 'USD')).toBe('$29.99')
    expect(formatCurrency(5000, 'CNY')).toBe('¥50.00')
    expect(formatCurrency(1850, 'GBP')).toBe('£18.50')
  })
})

describe('calculateProductMargin', () => {
  it('calculates same-currency margin correctly', () => {
    // Price ¥200 (20000 cents), Cost ¥80 (8000 cents)
    const result = calculateProductMargin({
      priceMinor: 20000,
      currency: 'CNY',
      costMinor: 8000,
      costCurrency: 'CNY',
    })
    expect(result.priceInCnyMinor).toBe(20000)
    expect(result.costInCnyMinor).toBe(8000)
    expect(result.profitInCnyMinor).toBe(12000)
    expect(result.marginRate).toBe(60.0)
    expect(result.marginLevel).toBe('high')
  })

  it('calculates cross-currency margin: USD price with CNY procurement cost', () => {
    // Selling price: $29.99 (2999 cents), Procurement cost: ¥50.00 (5000 cents), Rate: 7.20
    // Price in CNY: 2999 * 7.2 = 21593 cents (¥215.93)
    // Cost in CNY: 5000 cents (¥50.00)
    // Profit in CNY: 21593 - 5000 = 16593 cents (¥165.93)
    // Margin: (16593 / 21593) * 100 = 76.8%
    const result = calculateProductMargin({
      priceMinor: 2999,
      currency: 'USD',
      costMinor: 5000,
      costCurrency: 'CNY',
      exchangeRate: 7.20,
    })
    expect(result.priceInCnyMinor).toBe(21593)
    expect(result.costInCnyMinor).toBe(5000)
    expect(result.profitInCnyMinor).toBe(16593)
    expect(result.marginRate).toBe(76.8)
    expect(result.marginLevel).toBe('high')
  })

  it('detects low margin and loss scenarios', () => {
    // Loss scenario: Selling price $5.00 * 7.2 = ¥36.00, Procurement cost = ¥40.00
    const lossResult = calculateProductMargin({
      priceMinor: 500,
      currency: 'USD',
      costMinor: 4000,
      costCurrency: 'CNY',
      exchangeRate: 7.20,
    })
    expect(lossResult.profitInCnyMinor).toBe(-400) // -¥4.00
    expect(lossResult.marginRate).toBe(-11.1)
    expect(lossResult.marginLevel).toBe('loss')

    // Low margin scenario (<20%)
    const lowResult = calculateProductMargin({
      priceMinor: 10000,
      currency: 'CNY',
      costMinor: 8500,
      costCurrency: 'CNY',
    })
    expect(lowResult.marginRate).toBe(15.0)
    expect(lowResult.marginLevel).toBe('low')
  })
})

describe('buildProductRows', () => {
  it('maps product records into rich rows with exchange rate and margin data', () => {
    const rows = buildProductRows([
      {
        id: 'p1',
        name: '海景蓝牙音箱',
        category: 'electronics',
        priceMinor: 19900,
        costMinor: 9200,
        currency: 'CNY',
        costCurrency: 'CNY',
        exchangeRate: 1.0,
        status: 'active',
        region: 'US',
      },
      {
        id: 'p2',
        name: '北美爆款发光水杯',
        category: 'home',
        priceMinor: 2500, // $25.00
        costMinor: 4500, // ¥45.00
        currency: 'USD',
        costCurrency: 'CNY',
        exchangeRate: 7.20,
        status: 'active',
        region: 'US',
      },
    ])

    expect(rows[0]).toMatchObject({
      id: 'p1',
      priceMinor: 19900,
      costMinor: 9200,
      marginMinor: 10700,
      marginRate: 53.8,
      marginLevel: 'high',
    })

    // p2: $25.00 * 7.2 = ¥180.00 (18000 cents). Profit: 18000 - 4500 = 13500 cents (¥135.00). Margin: 75.0%
    expect(rows[1]).toMatchObject({
      id: 'p2',
      currency: 'USD',
      costCurrency: 'CNY',
      exchangeRate: 7.20,
      priceInCnyMinor: 18000,
      costInCnyMinor: 4500,
      profitInCnyMinor: 13500,
      marginRate: 75.0,
      marginLevel: 'high',
    })
  })
})
