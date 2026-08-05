/** PocketBase 设计素材记录到前端领域类型的唯一映射入口。 */
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import type { DesignAsset } from '../types'

export function mapDesignAsset(record: RecordModel): DesignAsset {
  const file = String(record.file || '')
  return {
    id: record.id,
    fileName: String(record.file_name),
    file,
    fileUrl: file ? pb.files.getURL(record, file, { thumb: '600x400' }) : '',
    dimensions: String(record.dimensions || ''),
    region: record.region as DesignAsset['region'],
    status: (record.status || 'draft') as DesignAsset['status'],
    owner: String(record.owner || ''),
    reviewReason: String(record.review_reason || ''),
    reviewedBy: String(record.reviewed_by || ''),
    reviewedAt: String(record.reviewed_at || ''),
    created: String(record.created),
    updated: String(record.updated),
  }
}
