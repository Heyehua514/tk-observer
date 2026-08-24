import { z } from 'zod'

const metric = z.number().int().nonnegative()
export const videoSyncPayloadSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200),
  source: z.literal('wechat_channels_android'),
  account: z.object({
    externalId: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(160),
  }),
  snapshot: z.object({ date: z.string().date(), followerCount: metric }),
  videos: z.array(
    z.object({
      externalId: z.string().trim().min(1).max(200),
      title: z.string().trim().min(1).max(240),
      publishDate: z.string().date(),
      views: metric,
      completionRate: z.number().min(0).max(100),
      likes: metric,
      comments: metric,
      followerGain: metric,
      videoType: z.string().trim().min(1).max(60),
    })
  ),
})
export type VideoSyncPayload = z.infer<typeof videoSyncPayloadSchema>
export function parseVideoSyncPayload(value: unknown): VideoSyncPayload {
  return videoSyncPayloadSchema.parse(value)
}
