/** 商务商机数据库字段映射；兼容 Supabase/PocketBase。 */
import type { OpportunityView } from './opportunity-view'

export function mapOpportunityRecord(
  record: Record<string, unknown>
): OpportunityView {
  const expand = record.expand as { client?: { name?: unknown } } | undefined
  const client = (record.clients || expand?.client) as
    { name?: unknown } | undefined
  return {
    id: String(record.id || ''),
    client: String(record.client_id || record.client || ''),
    clientName: String(client?.name || '未知客户'),
    title: String(record.title || ''),
    amount: Number(record.amount || 0),
    stage: record.stage as OpportunityView['stage'],
    probability: Number(record.probability || 0),
    expectedClose: String(record.expected_close || ''),
    notes: String(record.notes || ''),
  }
}

export function serializeOpportunityPayload(payload: Record<string, unknown>) {
  return {
    title: String(payload.title || ''),
    client_id: String(payload.client || ''),
    amount: Number(payload.amount || 0),
    type: String(payload.type || 'other'),
    stage: String(payload.stage || 'contact'),
    probability: Number(payload.probability || 0),
    lost_reason: payload.lost_reason ? String(payload.lost_reason) : null,
    expected_close: payload.expected_close
      ? String(payload.expected_close)
      : null,
    notes: payload.notes ? String(payload.notes) : null,
  }
}
