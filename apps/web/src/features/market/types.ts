/** 市场工作台类型：为选品库和后续列表 CRUD 预留统一搜索参数。 */
export type MarketSearchParams = {
  query: string
  recordType?: 'product'
  recordId?: string
}
