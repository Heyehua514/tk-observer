/** 市场选品库 Supabase 映射层；权限：market/boss 只读。 */
type ProductRowLike = Record<string, unknown>

export function mapSupabaseProduct(record: ProductRowLike) {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    category: String(record.category || ''),
    priceMinor: Number(record.price_minor || 0),
    costMinor: Number(record.cost_minor || 0),
    currency: String(record.currency || 'CNY'),
    status: String(record.status || ''),
    region: String(record.region || ''),
  }
}
