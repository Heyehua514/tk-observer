import { createHash } from 'node:crypto'

const integer = (value, name) => {
  const number = Number(value ?? 0)
  if (!Number.isInteger(number) || number < 0) throw new Error(`${name} must be a non-negative integer`)
  return number
}

export function normalizeCapture({ account, capturedAt, followerCount, videos }) {
  if (!account?.externalId || !account?.name) throw new Error('account.externalId and account.name are required')
  if (followerCount === undefined || followerCount === null) throw new Error('followerCount is required')
  if (!Array.isArray(videos)) throw new Error('videos must be an array')
  const snapshotDate = String(capturedAt || new Date().toISOString()).slice(0, 10)
  const normalizedVideos = videos.map((video, index) => ({
    externalId: String(video.externalId || video.id || video.hash || `${account.externalId}:${video.publishTime || index}`),
    title: String(video.title || video.videoTitle || `未命名视频 ${index + 1}`).trim(),
    publishDate: String(video.publishDate || video.publishTime || snapshotDate).slice(0, 10),
    views: integer(video.views ?? video.playCount, 'views'),
    completionRate: Math.max(0, Math.min(100, Number(video.completionRate ?? video.playCompleteRate ?? 0))),
    likes: integer(video.likes ?? video.likeCount, 'likes'),
    comments: integer(video.comments ?? video.commentCount, 'comments'),
    followerGain: integer(video.followerGain ?? 0, 'followerGain'),
    videoType: String(video.videoType || '待分类').trim(),
  }))
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify({ account, snapshotDate, followerCount, videos: normalizedVideos }))
    .digest('hex')
  return {
    idempotencyKey,
    source: 'wechat_channels_android',
    account: { externalId: String(account.externalId), name: String(account.name) },
    snapshot: { date: snapshotDate, followerCount: integer(followerCount, 'followerCount') },
    videos: normalizedVideos,
  }
}

export function readCaptureFile(value) {
  return normalizeCapture(value)
}
