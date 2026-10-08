/** 达人触达跟进记录与前端领域类型映射入口，兼容 Supabase 与 PocketBase。 */
import type {
  CreatorFollowUp,
  CreatorFollowUpInput,
  FollowUpChannel,
  CooperationStatus,
} from '../types'

type CreatorFollowUpRecord = {
  id?: unknown
  creator_id?: unknown
  creator?: unknown
  channel?: unknown
  status?: unknown
  summary?: unknown
  contacted_at?: unknown
  contactedAt?: unknown
  next_follow_up_at?: unknown
  nextFollowUpAt?: unknown
  operator_name?: unknown
  operatorName?: unknown
  created?: unknown
  created_at?: unknown
  updated?: unknown
  updated_at?: unknown
}

export function mapCreatorFollowUp(
  record: CreatorFollowUpRecord
): CreatorFollowUp {
  return {
    id: String(record.id || ''),
    creatorId: String(record.creator_id || record.creator || ''),
    channel: (record.channel || 'whatsapp') as FollowUpChannel,
    status: (record.status || 'contacting') as CooperationStatus,
    summary: String(record.summary || ''),
    contactedAt: String(
      record.contacted_at ||
        record.contactedAt ||
        record.created_at ||
        record.created ||
        new Date().toISOString()
    ),
    nextFollowUpAt: record.next_follow_up_at
      ? String(record.next_follow_up_at)
      : undefined,
    operatorName: String(
      record.operator_name || record.operatorName || '董雨辰'
    ),
    created: String(record.created_at || record.created || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function serializeCreatorFollowUp(input: CreatorFollowUpInput) {
  return {
    creator_id: input.creatorId,
    channel: input.channel,
    status: input.status,
    summary: input.summary,
    contacted_at: input.contactedAt || new Date().toISOString(),
    next_follow_up_at: input.nextFollowUpAt || null,
    operator_name: input.operatorName || '董雨辰',
  }
}
