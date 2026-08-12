/** 商务工作台渠道商单新建模型；表单字段转 PocketBase payload。 */
import { orderAmountInput } from './order-amount'

export type OrderCreateDraft = {
  title: string
  client: string
  creator: string
  amount: string
  platform: string
  contentType: string
  publishDate: string
}

export function orderCreatePayload(draft: OrderCreateDraft) {
  const amount = orderAmountInput(draft.amount)
  const title = draft.title.trim()
  if (!title || !draft.client || !draft.creator || amount === null) return null
  return {
    title,
    client: draft.client,
    creator: draft.creator,
    amount,
    platform: draft.platform,
    content_type: draft.contentType,
    publish_date: draft.publishDate ? `${draft.publishDate} 00:00:00.000Z` : '',
    status: 'negotiating',
  }
}
