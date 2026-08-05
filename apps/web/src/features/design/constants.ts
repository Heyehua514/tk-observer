/** 设计素材审批状态常量。 */
import type { DesignAssetStatus } from './types'

export const designAssetStatusLabels: Record<DesignAssetStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}
