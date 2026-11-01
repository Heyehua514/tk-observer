/** 设计素材深链状态测试；权限：纯函数，无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  canAccessDesignAssets,
  canReviewDesignAssets,
  resolveDesignAssetDeepLink,
} from './design-asset-deep-link'
import type { DesignAsset } from './types'

const asset: DesignAsset = {
  id: 'asset-2',
  fileName: '待审素材.png',
  file: '',
  fileUrl: '',
  dimensions: '1080x1920',
  region: 'UK',
  status: 'pending_review',
  owner: 'designer-1',
  reviewReason: '',
  reviewedBy: '',
  reviewedAt: '',
  created: '2026-10-30T00:00:00.000Z',
  updated: '2026-10-30T01:00:00.000Z',
}

const baseInput = {
  recordType: 'design_asset' as const,
  recordId: asset.id,
  role: 'boss' as const,
  assets: [asset],
  isLoading: false,
  isError: false,
}

describe('design asset permissions', () => {
  it('allows global reviewers and designers to open assets', () => {
    expect(canAccessDesignAssets('owner')).toBe(true)
    expect(canAccessDesignAssets('boss')).toBe(true)
    expect(canAccessDesignAssets('design')).toBe(true)
    expect(canAccessDesignAssets('business')).toBe(false)
    expect(canReviewDesignAssets('owner')).toBe(true)
    expect(canReviewDesignAssets('boss')).toBe(true)
    expect(canReviewDesignAssets('design')).toBe(false)
  })
})

describe('resolveDesignAssetDeepLink', () => {
  it('finds the exact linked asset', () => {
    expect(resolveDesignAssetDeepLink(baseInput)).toEqual({
      status: 'found',
      asset,
    })
  })

  it('distinguishes loading, missing, query error and forbidden access', () => {
    expect(
      resolveDesignAssetDeepLink({
        ...baseInput,
        assets: undefined,
        isLoading: true,
      })
    ).toEqual({ status: 'loading' })
    expect(resolveDesignAssetDeepLink({ ...baseInput, assets: [] })).toEqual({
      status: 'missing',
    })
    expect(
      resolveDesignAssetDeepLink({
        ...baseInput,
        assets: undefined,
        isError: true,
      })
    ).toEqual({ status: 'error' })
    expect(
      resolveDesignAssetDeepLink({ ...baseInput, role: 'business' })
    ).toEqual({ status: 'forbidden' })
  })

  it('ignores incomplete or unrelated deep links', () => {
    expect(
      resolveDesignAssetDeepLink({ ...baseInput, recordType: undefined })
    ).toEqual({ status: 'inactive' })
    expect(
      resolveDesignAssetDeepLink({ ...baseInput, recordId: undefined })
    ).toEqual({ status: 'inactive' })
  })
})
