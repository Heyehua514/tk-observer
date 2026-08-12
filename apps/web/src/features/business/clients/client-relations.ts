/** 商务工作台客户详情关联模型；按客户聚合商机和商单。 */
export type ClientOpportunityRelation = {
  id: string
  client: string
  title: string
  amount: number
  stage: string
  probability: number
}

export type ClientOrderRelation = {
  id: string
  client: string
  title: string
  amount: number
  status: string
  publishDate: string
}

export function buildClientRelations(
  clientId: string,
  opportunities: ClientOpportunityRelation[],
  orders: ClientOrderRelation[]
) {
  return {
    opportunities: opportunities.filter((item) => item.client === clientId),
    orders: orders.filter((item) => item.client === clientId),
  }
}
