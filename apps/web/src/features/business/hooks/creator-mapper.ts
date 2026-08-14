/** 达人记录与前端领域类型之间的唯一映射入口，兼容 Supabase/PocketBase。 */
import type { Creator, CreatorInput } from '../types'

type CreatorRecord = {
  id?: unknown
  nickname?: unknown
  tiktok_url?: unknown
  followers?: unknown
  region?: unknown
  cooperation_status?: unknown
  commission_rate?: unknown
  owner?: unknown
  owner_name?: unknown
  is_biz_available?: unknown
  cooperation_price?: unknown
  cooperation_notes?: unknown
  created?: unknown
  created_at?: unknown
  updated?: unknown
  updated_at?: unknown
}

export function mapCreator(record: CreatorRecord): Creator {
  return {
    id: String(record.id || ''),
    nickname: String(record.nickname),
    tiktokUrl: String(record.tiktok_url),
    followers: Number(record.followers),
    region: record.region as Creator['region'],
    cooperationStatus:
      record.cooperation_status as Creator['cooperationStatus'],
    commissionRate: Number(record.commission_rate),
    owner: String(record.owner_name || record.owner || ''),
    isBizAvailable: Boolean(record.is_biz_available),
    cooperationPrice: Number(record.cooperation_price || 0),
    cooperationNotes: String(record.cooperation_notes || ''),
    created: String(record.created_at || record.created || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function serializeCreator(input: CreatorInput) {
  return {
    nickname: input.nickname,
    tiktok_url: input.tiktokUrl,
    followers: input.followers,
    region: input.region,
    cooperation_status: input.cooperationStatus,
    commission_rate: input.commissionRate,
    owner: input.owner,
    owner_name: input.owner,
    is_biz_available: input.isBizAvailable,
    cooperation_price: input.cooperationPrice,
    cooperation_notes: input.cooperationNotes,
  }
}

export function serializeSupabaseCreator(input: CreatorInput) {
  const { owner: _owner, ...data } = serializeCreator(input)
  void _owner
  return data
}
