/** 商务工作台商机展示模型；统一卡片可见字段。 */
import type { OpportunityStage } from './opportunity-rules'

export type OpportunityView = {
  id: string
  client: string
  clientName: string
  title: string
  amount: number
  stage: OpportunityStage
  probability: number
  expectedClose: string
  notes: string
}

export function opportunityDueText(expectedClose: string) {
  return expectedClose ? expectedClose.slice(0, 10) : '未设置预计成交日'
}
