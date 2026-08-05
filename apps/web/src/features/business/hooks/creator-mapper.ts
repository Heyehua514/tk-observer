/** PocketBase 达人记录与前端领域类型之间的唯一映射入口。 */
import type { RecordModel } from 'pocketbase'
import type { Creator, CreatorInput } from '../types'

export function mapCreator(record: RecordModel): Creator {
  return {
    id: record.id,
    nickname: String(record.nickname),
    tiktokUrl: String(record.tiktok_url),
    followers: Number(record.followers),
    region: record.region as Creator['region'],
    cooperationStatus:
      record.cooperation_status as Creator['cooperationStatus'],
    commissionRate: Number(record.commission_rate),
    owner: String(record.owner),
    created: record.created,
    updated: record.updated,
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
  }
}
