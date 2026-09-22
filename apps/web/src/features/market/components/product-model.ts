export type ProductRecord = {
  id: string
  name: string
  category: string
  priceMinor: number
  costMinor: number
  currency?: string
  costCurrency?: string
  exchangeRate?: number
  region: string
  status: string
  createdAt?: string
}

export type MarginLevel = 'loss' | 'low' | 'normal' | 'high'

export type ProductRow = ProductRecord & {
  currency: string
  costCurrency: string
  exchangeRate: number
  marginMinor: number
  marginRate: number
  priceInCnyMinor: number
  costInCnyMinor: number
  profitInCnyMinor: number
  marginLevel: MarginLevel
}

export const SUPPORTED_CURRENCIES = [
  'USD',
  'CNY',
  'GBP',
  'EUR',
  'IDR',
  'THB',
  'VND',
  'MYR',
  'PHP',
  'SGD',
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

/** 目标市场默认法定币种映射 */
export const REGION_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  US: 'USD',
  UK: 'GBP',
  ID: 'IDR',
  TH: 'THB',
  VN: 'VND',
  MY: 'MYR',
  PH: 'PHP',
  SG: 'SGD',
}

/** 常用跨境币种对人民币基准参考汇率 */
export const DEFAULT_BENCHMARK_RATES: Record<string, number> = {
  USD: 7.20,
  GBP: 9.15,
  EUR: 7.80,
  SGD: 5.40,
  MYR: 1.62,
  THB: 0.21,
  PHP: 0.13,
  IDR: 0.00045,
  VND: 0.00028,
  CNY: 1.0,
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CNY: '¥',
  GBP: '£',
  EUR: '€',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  PHP: '₱',
  IDR: 'Rp',
  VND: '₫',
}

/** 获取指定币种对人民币默认汇率 */
export function getBenchmarkExchangeRate(currency: string): number {
  return DEFAULT_BENCHMARK_RATES[currency.toUpperCase()] ?? 1.0
}

/** 将指定币种金额(分/最小单位)转换为人民币(分) */
export function convertToCnyMinor(
  amountMinor: number,
  currency: string,
  exchangeRate?: number
): number {
  const normCurrency = currency.toUpperCase()
  if (normCurrency === 'CNY') {
    return Math.round(amountMinor)
  }
  const rate = exchangeRate && exchangeRate > 0 ? exchangeRate : getBenchmarkExchangeRate(normCurrency)
  return Math.round(amountMinor * rate)
}

/** 计算商品预估毛利、毛利率与健康度等级 */
export function calculateProductMargin(params: {
  priceMinor: number
  currency?: string
  costMinor: number
  costCurrency?: string
  exchangeRate?: number
}): {
  priceInCnyMinor: number
  costInCnyMinor: number
  profitInCnyMinor: number
  marginRate: number
  marginLevel: MarginLevel
} {
  const priceMinor = Number(params.priceMinor || 0)
  const costMinor = Number(params.costMinor || 0)
  const currency = (params.currency || 'USD').toUpperCase()
  const costCurrency = (params.costCurrency || 'CNY').toUpperCase()
  const rate = params.exchangeRate && params.exchangeRate > 0
    ? params.exchangeRate
    : getBenchmarkExchangeRate(currency)

  const priceInCnyMinor = convertToCnyMinor(priceMinor, currency, rate)

  // 采购成本折算：如果成本币种与售价币种一致，且非CNY，使用同一汇率；否则使用成本币种自身的参考汇率
  let costRate: number
  if (costCurrency === 'CNY') {
    costRate = 1.0
  } else if (costCurrency === currency) {
    costRate = rate
  } else {
    costRate = getBenchmarkExchangeRate(costCurrency)
  }

  const costInCnyMinor = convertToCnyMinor(costMinor, costCurrency, costRate)
  const profitInCnyMinor = priceInCnyMinor - costInCnyMinor

  const marginRate =
    priceInCnyMinor > 0
      ? Number(((profitInCnyMinor / priceInCnyMinor) * 100).toFixed(1))
      : 0

  let marginLevel: MarginLevel = 'normal'
  if (profitInCnyMinor < 0) {
    marginLevel = 'loss'
  } else if (marginRate < 20) {
    marginLevel = 'low'
  } else if (marginRate >= 50) {
    marginLevel = 'high'
  }

  return {
    priceInCnyMinor,
    costInCnyMinor,
    profitInCnyMinor,
    marginRate,
    marginLevel,
  }
}

/** 格式化币种金额显示 (分 -> 元/标准单位) */
export function formatCurrency(amountMinor: number, currency = 'USD'): string {
  const normCurrency = currency.toUpperCase()
  const symbol = CURRENCY_SYMBOLS[normCurrency] || normCurrency + ' '
  const value = (amountMinor / 100).toFixed(2)
  return `${symbol}${value}`
}

export function buildProductRows(records: ProductRecord[]): ProductRow[] {
  return records.map((record) => {
    const currency = (record.currency || 'USD').toUpperCase()
    const costCurrency = (record.costCurrency || 'CNY').toUpperCase()
    const exchangeRate = record.exchangeRate && record.exchangeRate > 0
      ? record.exchangeRate
      : getBenchmarkExchangeRate(currency)

    const marginCalc = calculateProductMargin({
      priceMinor: record.priceMinor,
      currency,
      costMinor: record.costMinor,
      costCurrency,
      exchangeRate,
    })

    return {
      ...record,
      currency,
      costCurrency,
      exchangeRate,
      marginMinor: marginCalc.profitInCnyMinor,
      marginRate: marginCalc.marginRate,
      priceInCnyMinor: marginCalc.priceInCnyMinor,
      costInCnyMinor: marginCalc.costInCnyMinor,
      profitInCnyMinor: marginCalc.profitInCnyMinor,
      marginLevel: marginCalc.marginLevel,
    }
  })
}
