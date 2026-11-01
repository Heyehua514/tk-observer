/** 设计素材深链聚焦与角色权限契约；用途：通知目标缺失或无权访问时安全降级。 */
import type { UserRole } from '@/types/auth'
import type { DesignAsset } from './types'

const designAssetViewRoles = new Set<UserRole>(['owner', 'boss', 'design'])

export function canAccessDesignAssets(role: UserRole | null | undefined) {
  return !!role && designAssetViewRoles.has(role)
}

export function canReviewDesignAssets(role: UserRole | null | undefined) {
  return role === 'owner' || role === 'boss'
}

export type DesignAssetDeepLinkState =
  | { status: 'inactive' }
  | { status: 'forbidden' }
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'found'; asset: DesignAsset }

export function resolveDesignAssetDeepLink(input: {
  recordType?: 'design_asset'
  recordId?: string
  role: UserRole | null | undefined
  assets: readonly DesignAsset[] | undefined
  isLoading: boolean
  isError: boolean
}): DesignAssetDeepLinkState {
  if (input.recordType !== 'design_asset' || !input.recordId) {
    return { status: 'inactive' }
  }
  if (!canAccessDesignAssets(input.role)) return { status: 'forbidden' }

  const asset = input.assets?.find((item) => item.id === input.recordId)
  if (asset) return { status: 'found', asset }
  if (input.isError) return { status: 'error' }
  if (input.isLoading || !input.assets) return { status: 'loading' }
  return { status: 'missing' }
}
