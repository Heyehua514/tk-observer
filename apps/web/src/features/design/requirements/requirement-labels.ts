import type { RequirementStatus } from './requirement-rules'

export const requirementStatusLabels: Record<RequirementStatus, string> = {
  pending: '待接单',
  in_progress: '制作中',
  delivered: '已交付',
  revised: '修改中',
}
