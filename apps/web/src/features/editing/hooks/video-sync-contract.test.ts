import { describe, expect, it } from 'vitest'
import { parseVideoSyncPayload } from './video-sync-contract'

describe('video sync contract', () => {
  it('accepts one account batch with video and follower metrics', () => {
    const payload = parseVideoSyncPayload({
      idempotencyKey: 'wechat-2026-08-24-account-a',
      source: 'wechat_channels_android',
      account: { externalId: 'channel-a', name: '账号 A' },
      snapshot: { date: '2026-08-24', followerCount: 12000 },
      videos: [{
        externalId: 'video-1', title: '示例视频', publishDate: '2026-08-23',
        views: 12000, completionRate: 62, likes: 500, comments: 48,
        followerGain: 36, videoType: '口播',
      }],
    })
    expect(payload.account.name).toBe('账号 A')
    expect(payload.videos[0].comments).toBe(48)
  })

  it('rejects negative metrics and invalid completion rates', () => {
    expect(() => parseVideoSyncPayload({
      idempotencyKey: 'wechat-2026-08-24-account-a', source: 'wechat_channels_android',
      account: { externalId: 'channel-a', name: '账号 A' },
      snapshot: { date: '2026-08-24', followerCount: 0 }, videos: [{
        externalId: 'video-1', title: '示例', publishDate: '2026-08-23', views: -1,
        completionRate: 101, likes: 0, comments: 0, followerGain: 0, videoType: '口播',
      }],
    })).toThrow()
  })
})
