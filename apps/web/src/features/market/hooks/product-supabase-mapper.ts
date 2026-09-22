/** 市场选品库 Supabase 映射层；权限：market/boss 只读。 */
import { DEFAULT_BENCHMARK_RATES } from '../components/product-model'

type ProductRowLike = Record<string, unknown>

export function mapSupabaseProduct(record: ProductRowLike) {
  const currency = String(record.currency || 'USD')
  const defaultRate = DEFAULT_BENCHMARK_RATES[currency.toUpperCase()] ?? 1.0

  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    category: String(record.category || ''),
    priceMinor: Number(record.price_minor || 0),
    costMinor: Number(record.cost_minor || 0),
    currency,
    costCurrency: String(record.cost_currency || 'CNY'),
    exchangeRate: Number(record.exchange_rate ?? defaultRate),
    status: String(record.status || 'draft'),
    region: String(record.region || 'US'),
    createdAt: typeof record.created_at === 'string' ? record.created_at : undefined,
  }
}
