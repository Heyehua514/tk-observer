/** 商务活动招商记录映射层；兼容 Supabase/PocketBase 展开结构。 */
export type Sponsorship = {
  id: string
  eventName: string
  company: string
  amount: number
  stage: string
  contact: string
}

type Joined = {
  events?: { name?: unknown } | null
  clients?: { name?: unknown; company_name?: unknown } | null
  expand?: {
    event?: { name?: unknown } | null
    client?: { name?: unknown; company_name?: unknown } | null
  }
}

export function mapSponsorshipRecord(
  record: Record<string, unknown> & Joined
): Sponsorship {
  return {
    id: String(record.id || ''),
    eventName: String(record.events?.name || record.expand?.event?.name || '—'),
    company: String(
      record.clients?.company_name ||
        record.clients?.name ||
        record.expand?.client?.company_name ||
        record.expand?.client?.name ||
        '—'
    ),
    amount: Number(record.amount || 0),
    stage: String(record.stage || ''),
    contact: String(record.contact_name || '—'),
  }
}
