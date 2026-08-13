/** 设计需求 Supabase 映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseDesignDeliverable,
  mapSupabaseDesignReference,
  mapSupabaseDesignRequirement,
  serializeSupabaseDesignRequirement,
} from './design-requirement-supabase-mapper'

describe('design requirement Supabase mapper', () => {
  it('maps requirement rows into the existing frontend shape', () => {
    expect(
      mapSupabaseDesignRequirement({
        id: 'req-1',
        title: '活动海报',
        description: '需要主视觉',
        requester_id: 'business-user',
        target_size: '1080x1920',
        usage_scene: '朋友圈宣发',
        copy_content: '金鳞会闭门沙龙',
        delivery_format: 'png',
        reference_urls: null,
        status: 'pending',
        priority: '高',
        due_date: '2026-08-20T00:00:00Z',
        created_at: '2026-08-13T01:00:00Z',
      })
    ).toMatchObject({
      id: 'req-1',
      requester: 'business-user',
      referenceUrls: '',
      status: 'pending',
      priority: '高',
      created: '2026-08-13T01:00:00Z',
    })
  })

  it('serializes requirement form fields to Supabase columns', () => {
    expect(
      serializeSupabaseDesignRequirement({
        title: '活动海报',
        description: '需要主视觉',
        requester: 'business-user',
        targetSize: '1080x1920',
        usageScene: '朋友圈宣发',
        copyContent: '金鳞会闭门沙龙',
        deliveryFormat: 'png',
        referenceUrls: '',
        priority: '高',
        dueDate: '2026-08-20',
      })
    ).toMatchObject({
      requester_id: 'business-user',
      target_size: '1080x1920',
      status: 'pending',
    })
  })

  it('maps references and deliverables without expanding UI changes', () => {
    expect(
      mapSupabaseDesignReference({
        id: 'ref-1',
        image_url: 'https://example.com/a.png',
        source: null,
        notes: null,
      })
    ).toEqual({
      id: 'ref-1',
      imageUrl: 'https://example.com/a.png',
      source: '',
      notes: '',
    })

    expect(
      mapSupabaseDesignDeliverable({
        id: 'del-1',
        asset_id: 'asset-1',
        design_assets: { file_name: '活动海报.png' },
        exported_size: '1080x1920',
        exported_format: 'png',
        checklist_ok: true,
        delivered_at: '2026-08-13T02:00:00Z',
      })
    ).toMatchObject({
      id: 'del-1',
      asset: 'asset-1',
      assetName: '活动海报.png',
      checklistOk: true,
    })
  })
})
