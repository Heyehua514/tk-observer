/** 成片表现数据回流映射与转换工具函数。 */
import type { VideoMetricsLog, VideoMetricsLogInput } from '../video-metrics-model'

type VideoMetricsLogRow = {
  id?: unknown
  video_id?: unknown
  views?: unknown
  likes?: unknown
  comments?: unknown
  shares?: unknown
  completion_rate?: unknown
  conversion_gmv_cents?: unknown
  order_count?: unknown
  logged_at?: unknown
  operator_name?: unknown
  notes?: unknown
  created_at?: unknown
  updated_at?: unknown
}

export function mapVideoMetricsLog(record: VideoMetricsLogRow): VideoMetricsLog {
  return {
    id: String(record.id || ''),
    videoId: String(record.video_id || ''),
    views: Number(record.views || 0),
    likes: Number(record.likes || 0),
    comments: Number(record.comments || 0),
    shares: Number(record.shares || 0),
    completionRate: Number(record.completion_rate || 0),
    conversionGmvCents: Number(record.conversion_gmv_cents || 0),
    orderCount: Number(record.order_count || 0),
    loggedAt: String(record.logged_at || record.created_at || new Date().toISOString()),
    operatorName: String(record.operator_name || '谢洁'),
    notes: record.notes ? String(record.notes) : undefined,
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function serializeVideoMetricsLog(input: VideoMetricsLogInput) {
  return {
    video_id: input.videoId,
    views: Math.max(0, Math.floor(input.views || 0)),
    likes: Math.max(0, Math.floor(input.likes || 0)),
    comments: Math.max(0, Math.floor(input.comments || 0)),
    shares: Math.max(0, Math.floor(input.shares || 0)),
    completion_rate: Math.min(100, Math.max(0, Number(input.completionRate || 0))),
    conversion_gmv_cents: Math.max(0, Math.floor(input.conversionGmvCents || 0)),
    order_count: Math.max(0, Math.floor(input.orderCount || 0)),
    logged_at: input.loggedAt || new Date().toISOString(),
    operator_name: input.operatorName || '谢洁',
    notes: input.notes?.trim() || null,
  }
}
