/** 成片表现数据时序趋势纯函数：增量曲线、中位数基线与爆款预警。 */
import type { VideoMetricsLog } from './video-metrics-model'

/** 爆款判定倍数：单次新增播放达到前序正增量中位数的 1.5 倍。 */
export const VIRAL_MULTIPLIER = 1.5
/** 判定爆款前至少需要的有效正增量样本数。 */
export const MIN_BASELINE_SAMPLES = 2

export type MetricsTrendPoint = {
  id: string
  loggedAt: string
  views: number
  likes: number
  /** 相对上一次打卡的新增播放，首条基线为 0。 */
  viewDelta: number
  /** 相对上一次打卡的新增点赞，首条基线为 0。 */
  likeDelta: number
  /** 该次增量是否触发爆款预警。 */
  viral: boolean
}

export type MetricsTrend = {
  points: MetricsTrendPoint[]
  totalViewDelta: number
  totalLikeDelta: number
  peakViewDelta: number
  medianViewDelta: number
  viralCount: number
}

export function calculateMedian(values: number[]): number {
  const safe = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (!safe.length) return 0
  const middle = Math.floor(safe.length / 2)
  if (safe.length % 2 === 1) return safe[middle]
  return (safe[middle - 1] + safe[middle]) / 2
}

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeMetric(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

/**
 * 把打卡记录转换为按时间升序的增量趋势。
 * 指标被下调时增量按 0 处理，避免负增长污染中位数基线。
 */
export function buildMetricsTrend(logs: VideoMetricsLog[]): MetricsTrend {
  const ordered = [...logs]
    .filter((log) => Boolean(log && log.loggedAt))
    .sort((left, right) => {
      const diff = timestamp(left.loggedAt) - timestamp(right.loggedAt)
      return diff !== 0 ? diff : String(left.id).localeCompare(String(right.id))
    })

  const points: MetricsTrendPoint[] = []
  const positiveViewDeltas: number[] = []
  let previous: VideoMetricsLog | null = null

  for (const log of ordered) {
    const views = safeMetric(log.views)
    const likes = safeMetric(log.likes)
    const viewDelta = previous ? Math.max(0, views - safeMetric(previous.views)) : 0
    const likeDelta = previous ? Math.max(0, likes - safeMetric(previous.likes)) : 0

    let viral = false
    if (viewDelta > 0 && positiveViewDeltas.length >= MIN_BASELINE_SAMPLES) {
      const baseline = calculateMedian(positiveViewDeltas)
      viral = baseline > 0 && viewDelta >= baseline * VIRAL_MULTIPLIER
    }

    if (viewDelta > 0) positiveViewDeltas.push(viewDelta)

    points.push({
      id: log.id,
      loggedAt: log.loggedAt,
      views,
      likes,
      viewDelta,
      likeDelta,
      viral,
    })
    previous = log
  }

  const totalViewDelta = positiveViewDeltas.reduce((sum, value) => sum + value, 0)
  const totalLikeDelta = points.reduce((sum, point) => sum + point.likeDelta, 0)
  const peakViewDelta = positiveViewDeltas.length ? Math.max(...positiveViewDeltas) : 0
  const medianViewDelta = calculateMedian(positiveViewDeltas)

  return {
    points,
    totalViewDelta,
    totalLikeDelta,
    peakViewDelta,
    medianViewDelta,
    viralCount: points.filter((point) => point.viral).length,
  }
}

/** 相对峰值增量的百分比宽度，用于列表条形图。 */
export function getDeltaBarPercent(delta: number, peak: number): number {
  if (!Number.isFinite(delta) || !Number.isFinite(peak) || peak <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((delta / peak) * 100)))
}