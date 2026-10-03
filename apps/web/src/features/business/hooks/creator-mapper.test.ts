/** 达人 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapCreator, serializeCreator } from './creator-mapper'

describe('creator mapper', () => {
  it('maps Supabase creator rows with contact details and category into frontend shape', () => {
    expect(
      mapCreator({
        id: 'creator-1',
        nickname: '跨境小杨',
        tiktok_url: 'https://www.tiktok.com/@yang',
        followers: 120000,
        region: 'US',
        cooperation_status: 'contacting',
        commission_rate: 12,
        owner_name: '董雨辰',
        is_biz_available: true,
        cooperation_price: 50_000,
        cooperation_notes: '含植入脚本',
        contact_email: 'yang@example.com',
        contact_phone: '+1 234 567 8900',
        category: '3C数码',
        last_contacted_at: '2026-10-02T10:00:00Z',
        created_at: '2026-08-12T01:00:00Z',
        updated_at: '2026-08-12T02:00:00Z',
      })
    ).toEqual({
      id: 'creator-1',
      nickname: '跨境小杨',
      tiktokUrl: 'https://www.tiktok.com/@yang',
      followers: 120000,
      region: 'US',
      cooperationStatus: 'contacting',
      commissionRate: 12,
      owner: '董雨辰',
      isBizAvailable: true,
      cooperationPrice: 50000,
      cooperationNotes: '含植入脚本',
      contactEmail: 'yang@example.com',
      contactPhone: '+1 234 567 8900',
      category: '3C数码',
      lastContactedAt: '2026-10-02T10:00:00Z',
      created: '2026-08-12T01:00:00Z',
      updated: '2026-08-12T02:00:00Z',
    })
  })

  it('serializes frontend creator input into Supabase column names', () => {
    expect(
      serializeCreator({
        nickname: '跨境小杨',
        tiktokUrl: 'https://www.tiktok.com/@yang',
        followers: 120000,
        region: 'US',
        cooperationStatus: 'signed',
        commissionRate: 10,
        owner: '董雨辰',
        isBizAvailable: true,
        cooperationPrice: 50_000,
        cooperationNotes: '含植入脚本',
        contactEmail: 'yang@example.com',
        contactPhone: '+1 234 567 8900',
        category: '美妆个护',
      })
    ).toMatchObject({
      nickname: '跨境小杨',
      tiktok_url: 'https://www.tiktok.com/@yang',
      owner_name: '董雨辰',
      cooperation_status: 'signed',
      is_biz_available: true,
      cooperation_price: 50000,
      cooperation_notes: '含植入脚本',
      contact_email: 'yang@example.com',
      contact_phone: '+1 234 567 8900',
      category: '美妆个护',
    })
  })

  it('handles optional contact details gracefully without owner leak', () => {
    const { owner: _owner, ...supabase } = serializeCreator({
      nickname: '跨境小杨',
      tiktokUrl: 'https://www.tiktok.com/@yang',
      followers: 120000,
      region: 'US',
      cooperationStatus: 'signed',
      commissionRate: 10,
      owner: '董雨辰',
      isBizAvailable: false,
      cooperationPrice: 0,
      cooperationNotes: '',
    })
    expect(supabase).not.toHaveProperty('owner')
    expect(supabase).toMatchObject({
      is_biz_available: false,
      cooperation_price: 0,
      cooperation_notes: '',
      contact_email: null,
      contact_phone: null,
      category: '通用',
    })
  })
})
