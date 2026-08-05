/** 设计工作台领域类型：素材、审批状态和上传输入。 */
import type { Region } from '@/types/commerce'

export type DesignAssetStatus =
  'draft' | 'pending_review' | 'approved' | 'rejected'

export type DesignAsset = {
  id: string
  fileName: string
  file: string
  fileUrl: string
  dimensions: string
  region: Region
  status: DesignAssetStatus
  owner: string
  reviewReason: string
  reviewedBy: string
  reviewedAt: string
  created: string
  updated: string
}

export type DesignAssetInput = {
  fileName: string
  file: File
  dimensions: string
  region: Region
}

export type DesignAssetListParams = {
  query: string
  status: DesignAssetStatus | 'all'
  region: Region | 'all'
  sort: '-updated' | '-created' | 'file_name' | '-file_name'
}
