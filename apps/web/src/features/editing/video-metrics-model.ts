/** 成片数据表现回流领域类型与纯函数模型。 */

export type VideoMetrics = {
  views: number
  likes: number
  comments: number
  shares: number
  completionRate: number
  conversionGmvCents: number
  orderCount: number
}

export type VideoMetricsLog = VideoMetrics & {
  id: string
  videoId: string
  loggedAt: string
  operatorName: string
  notes?: string
  created?: string
  updated?: string
}

export type VideoMetricsLogInput = VideoMetrics & {
  videoId: string
  loggedAt?: string
  operatorName?: string
  notes?: string
}

export function formatGmv(cents: number): string {
  const safeCents = Math.max(0, Math.floor(cents || 0))
  return (safeCents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function calculateEngagementRate(metrics: {
  views: number
  likes: number
  comments: number
  shares: number
}): number {
  if (!metrics.views || metrics.views <= 0) return 0
  const interactions = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)
  const rate = (interactions / metrics.views) * 100
  return Number(rate.toFixed(2))
}
