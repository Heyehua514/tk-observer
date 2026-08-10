/** 设计需求工作流类型；权限：boss/business 提交，design 处理。 */
import type { RequirementStatus } from './requirement-rules'

export type DesignPriority = '高' | '中' | '低'

export type DesignRequirement = {
  id: string
  title: string
  description: string
  requester: string
  targetSize: string
  usageScene: string
  copyContent: string
  deliveryFormat: string
  referenceUrls: string
  status: RequirementStatus
  priority: DesignPriority
  dueDate: string
  created: string
}

export type DesignRequirementInput = Omit<
  DesignRequirement,
  'id' | 'status' | 'created'
>

export type DesignReference = {
  id: string
  imageUrl: string
  source: string
  notes: string
}

export type DesignDeliverable = {
  id: string
  asset: string
  assetName: string
  exportedSize: string
  exportedFormat: string
  checklistOk: boolean
  deliveredAt: string
}
