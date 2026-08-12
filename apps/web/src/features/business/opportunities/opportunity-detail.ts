/** 商务工作台商机详情编辑模型；用于卡片详情弹窗。 */
import { opportunityStagePatch, type OpportunityStage } from './opportunity-rules'

export type OpportunityDetailDraft = {
  stage: OpportunityStage
  expectedClose: string
  notes: string
  lostReason: string
}

export function opportunityDetailPatch(draft: OpportunityDetailDraft) {
  return {
    ...opportunityStagePatch(draft.stage, draft.lostReason),
    expected_close: draft.expectedClose
      ? `${draft.expectedClose} 00:00:00.000Z`
      : '',
    notes: draft.notes.trim(),
  }
}
