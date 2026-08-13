/** 设计工作台 Supabase 映射层。 */
import type { Database } from '@/types/database.generated'
import type { DesignAsset, DesignAssetInput, DesignAssetStatus } from '../types'

type DesignAssetRow = Database['public']['Tables']['design_assets']['Row']
type PartialRecord<T> = Partial<T> & Record<string, unknown>

export function mapSupabaseDesignAsset(
  record: PartialRecord<DesignAssetRow>
): DesignAsset {
  const file = String(record.file_path || '')
  return {
    id: String(record.id || ''),
    fileName: String(record.file_name || ''),
    file,
    fileUrl: file,
    dimensions: String(record.dimensions || ''),
    region: record.region as DesignAsset['region'],
    status: (record.status || 'draft') as DesignAsset['status'],
    owner: String(record.owner_id || ''),
    reviewReason: String(record.review_reason || ''),
    reviewedBy: String(record.reviewed_by || ''),
    reviewedAt: String(record.reviewed_at || ''),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function serializeSupabaseDesignAssetUpload(
  input: DesignAssetInput,
  ownerId: string,
  filePath: string
) {
  return {
    file_name: input.fileName,
    file_path: filePath,
    dimensions: input.dimensions || null,
    region: input.region,
    status: 'draft',
    owner_id: ownerId || null,
  }
}

export function serializeSupabaseDesignAssetStatus(
  input: {
    id: string
    status: Extract<
      DesignAssetStatus,
      'pending_review' | 'approved' | 'rejected'
    >
    reason?: string
  },
  reviewerId: string
) {
  if (input.status === 'pending_review') {
    return {
      status: input.status,
      review_reason: '',
      reviewed_by: null,
      reviewed_at: null,
    }
  }
  return {
    status: input.status,
    review_reason: input.reason || '',
    reviewed_by: reviewerId || null,
    reviewed_at: new Date().toISOString(),
  }
}
