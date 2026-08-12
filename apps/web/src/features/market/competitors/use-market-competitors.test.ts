import { describe, expect, it } from 'vitest'
import { mapMarketCompetitor } from './use-market-competitors'

describe('mapMarketCompetitor', () => {
  it('maps shared competitor_accounts records into market rows', () => {
    expect(
      mapMarketCompetitor({
        id: 'c1',
        name: '霞光社',
        platform: '微信公众号',
        category: '出海跨境',
        profile_url: 'https://example.com',
        follower_count: 120000,
        avg_views: 56000,
        notes: '选题偏跨境服务商',
        updated: '2026-08-12 10:00:00.000Z',
      } as never)
    ).toEqual({
      id: 'c1',
      name: '霞光社',
      platform: '微信公众号',
      category: '出海跨境',
      profileUrl: 'https://example.com',
      followerCount: 120000,
      averageViews: 56000,
      notes: '选题偏跨境服务商',
      updated: '2026-08-12 10:00:00.000Z',
    })
  })
})
