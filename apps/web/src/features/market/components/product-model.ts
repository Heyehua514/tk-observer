/** 市场工作台选品库模型：把 products 表转成可展示行。 */
export type ProductRow = {
  id: string
  name: string
  category: string
  priceMinor: number
  costMinor: number
  marginMinor: number
  marginRate: number
  currency: string
  status: string
  region: string
}

type ProductRecord = {
  id: string
  name: string
  category: string
  priceMinor: number
  costMinor: number
  currency: string
  status: string
  region: string
}

export function buildProductRows(records: ProductRecord[]): ProductRow[] {
  return records.map((record) => {
    const priceMinor = Number(record.priceMinor || 0)
    const costMinor = Number(record.costMinor || 0)
    const marginMinor = priceMinor - costMinor
    const marginRate =
      priceMinor > 0 ? Number(((marginMinor / priceMinor) * 100).toFixed(1)) : 0
    return {
      id: record.id,
      name: record.name,
      category: record.category,
      priceMinor,
      costMinor,
      marginMinor,
      marginRate,
      currency: record.currency,
      status: record.status,
      region: record.region,
    }
  })
}
