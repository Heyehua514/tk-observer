/** 设计工作台 Supabase 映射自检：保证切换数据源不改变 UI 模型。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseDesignAsset,
  serializeSupabaseDesignAssetStatus,
  serializeSupabaseDesignAssetUpload,
  toSupabaseDesignAssetSort,
} from './design-supabase-mapper'

describe('design Supabase mapper', () => {
  it('maps design asset rows into the existing frontend shape', () => {
    expect(
      mapSupabaseDesignAsset({
        id: 'asset-1',
        file_name: '活动海报.png',
        file_path: 'design-assets/activity.png',
        dimensions: null,
        region: 'US',
        status: 'pending_review',
        owner_id: 'design-user',
        review_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: '2026-08-13T01:00:00Z',
        updated_at: '2026-08-13T02:00:00Z',
      })
    ).toMatchObject({
      id: 'asset-1',
      fileName: '活动海报.png',
      file: 'design-assets/activity.png',
      fileUrl: 'design-assets/activity.png',
      dimensions: '',
      owner: 'design-user',
      status: 'pending_review',
      created: '2026-08-13T01:00:00Z',
      updated: '2026-08-13T02:00:00Z',
    })
  })

  it('serializes upload and review fields for Supabase columns', () => {
    expect(
      serializeSupabaseDesignAssetUpload({
        fileName: '活动海报.png',
        file: new File(['x'], 'activity.png', { type: 'image/png' }),
        dimensions: '1080x1920',
        region: 'US',
      }, 'design-user', 'design-assets/activity.png')
    ).toMatchObject({
      file_name: '活动海报.png',
      file_path: 'design-assets/activity.png',
      owner_id: 'design-user',
      status: 'draft',
    })

    expect(
      serializeSupabaseDesignAssetStatus({
        id: 'asset-1',
        status: 'approved',
      }, 'boss-user')
    ).toMatchObject({
      status: 'approved',
      reviewed_by: 'boss-user',
    })
  })

  it('maps frontend sort values to Supabase column names', () => {
    expect(toSupabaseDesignAssetSort('-updated')).toBe('-updated_at')
    expect(toSupabaseDesignAssetSort('-created')).toBe('-created_at')
    expect(toSupabaseDesignAssetSort('file_name')).toBe('file_name')
    expect(toSupabaseDesignAssetSort('-file_name')).toBe('-file_name')
  })
})
