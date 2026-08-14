/** 商务渠道商单 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapOrderRecord, serializeOrderPayload } from './order-mapper'

describe('order mapper', () => {
  it('maps Supabase order rows with joined client and creator names', () => {
    expect(
      mapOrderRecord({
        id: 'order-1',
        title: '开箱合作',
        clients: { name: '远海品牌' },
        creators: { nickname: '跨境小杨' },
        amount: 120000,
        status: 'confirmed',
        platform: 'tiktok',
        content_type: 'unboxing',
        publish_date: null,
        cancel_reason: '预算调整',
      })
    ).toMatchObject({
      id: 'order-1',
      clientName: '远海品牌',
      creatorName: '跨境小杨',
      publishDate: '',
      cancelReason: '预算调整',
    })
  })

  it('renames client and creator to Supabase foreign keys', () => {
    expect(
      serializeOrderPayload({
        title: '开箱合作',
        client: 'c1',
        creator: 'creator-1',
        platform: 'tiktok',
        content_type: 'unboxing',
        amount: 120000,
        status: 'negotiating',
        publish_date: '',
      })
    ).toMatchObject({
      client_id: 'c1',
      creator_id: 'creator-1',
      publish_date: null,
    })
  })
})
