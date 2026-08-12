/** 达人 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapCreator, serializeCreator } from './creator-mapper'

describe('creator mapper', () => {
  it('maps Supabase creator rows into the existing frontend shape', () => {
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
      })
    ).toMatchObject({
      nickname: '跨境小杨',
      tiktok_url: 'https://www.tiktok.com/@yang',
      owner_name: '董雨辰',
      cooperation_status: 'signed',
    })
  })
})
