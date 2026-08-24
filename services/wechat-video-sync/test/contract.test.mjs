import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCapture } from '../src/contract.mjs'

test('normalizes GitHub collector output into the workbench contract', () => {
  const payload = normalizeCapture({
    account: { externalId: 'channel-a', name: '账号 A' },
    capturedAt: '2026-08-24T01:00:00.000Z', followerCount: 120,
    videos: [{ hash: 'cover-hash', videoTitle: '测试', playCount: 1000, playCompleteRate: '62', likeCount: 20, commentCount: 3 }],
  })
  assert.equal(payload.source, 'wechat_channels_android')
  assert.equal(payload.videos[0].views, 1000)
  assert.equal(payload.videos[0].comments, 3)
  assert.equal(payload.snapshot.followerCount, 120)
})

test('rejects malformed account and negative metrics', () => {
  assert.throws(() => normalizeCapture({ account: { name: '缺 ID' }, videos: [] }))
  assert.throws(() => normalizeCapture({ account: { externalId: 'a', name: 'A' }, videos: [] }))
  assert.throws(() => normalizeCapture({ account: { externalId: 'a', name: 'A' }, followerCount: 1, videos: [{ playCount: -1 }] }))
})
