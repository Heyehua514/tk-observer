/** 渠道商单数据库字段映射；兼容 Supabase/PocketBase。 */
export type OrderRow = {
  id: string
  title: string
  clientName: string
  creatorName: string
  amount: number
  status: string
  platform: string
  contentType: string
  publishDate: string
}

export function mapOrderRecord(record: Record<string, unknown>): OrderRow {
  const expand = record.expand as
    | { client?: { name?: unknown }; creator?: { nickname?: unknown } }
    | undefined
  const client = (record.clients || expand?.client) as { name?: unknown } | undefined
  const creator = (record.creators || expand?.creator) as
    | { nickname?: unknown }
    | undefined
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    clientName: String(client?.name || '—'),
    creatorName: String(creator?.nickname || '—'),
    amount: Number(record.amount || 0),
    status: String(record.status || ''),
    platform: String(record.platform || ''),
    contentType: String(record.content_type || ''),
    publishDate: String(record.publish_date || ''),
  }
}

export function serializeOrderPayload(payload: Record<string, unknown>) {
  return {
    title: String(payload.title || ''),
    client_id: String(payload.client || ''),
    creator_id: String(payload.creator || ''),
    platform: String(payload.platform || ''),
    content_type: String(payload.content_type || ''),
    amount: Number(payload.amount || 0),
    status: String(payload.status || 'negotiating'),
    publish_date: payload.publish_date ? String(payload.publish_date) : null,
    commission: payload.commission ? Number(payload.commission) : null,
    notes: payload.notes ? String(payload.notes) : null,
  }
}
