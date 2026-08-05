/**
 * 跨工作台可安全复用的商务公共类型。
 * 其他 feature 只能从此处引用商务摘要，不能反向依赖 business feature。
 */
export type CreatorSummary = {
  id: string
  nickname: string
  region: string
  cooperationStatus: string
}
