/** 商务工作台商机新建模型；表单字段转 PocketBase payload。 */
import { opportunityStagePatch } from './opportunity-rules'
import { yuanToFen } from './opportunity-amount'

export type OpportunityCreateDraft = {
  title: string
  client: string
  amount: string
  expectedClose: string
  notes: string
}

export function opportunityCreatePayload(draft: OpportunityCreateDraft) {
  const title = draft.title.trim()
  const client = draft.client.trim()
  const amount = yuanToFen(draft.amount)
  if (!title || !client || amount === null) return null
  return {
    title,
    client,
    amount,
    type: 'other',
    expected_close: draft.expectedClose
      ? `${draft.expectedClose} 00:00:00.000Z`
      : '',
    notes: draft.notes.trim(),
    ...opportunityStagePatch('contact'),
  }
}
