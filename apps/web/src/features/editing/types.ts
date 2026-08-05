/** 剪辑工作台类型：为视频任务和成片归档预留搜索参数。 */
export type EditingSearchParams = {
  query: string
  recordType?: 'video'
  recordId?: string
}
