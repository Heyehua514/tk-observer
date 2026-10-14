/**
 * 跨境出海全主链路跨域流转与状态协同编排器 (Cross-Domain Lifecycle Orchestrator)
 * 链路：
 * 爆品雷达 (Product Radar)
 *   ↓ (筛选入库与汇率换算)
 * 选品库 (Product Catalog)
 *   ↓ (合作匹配与建联)
 * 达人 CRM (Creator & Follow-ups)
 *   ↓ (任务制作与交付)
 * 视频矩阵 (Video Tasks & Archives)
 *   ↓ (发布排期与数据回流)
 * 表现复盘 (Performance & Feedback)
 */
import type { ProductRadarItem } from '@/features/market/radar/types'
import type { ProductRecord } from '@/features/market/components/product-model'
import { calculateProductMargin } from '@/features/market/components/product-model'
import type { Creator, CreatorFollowUp, FollowUpChannel } from '@/features/business/types'
import type { VideoTaskStatus, AutoScheduleTaskSource } from '@/features/editing/video-task-lifecycle'
import { buildAutoSchedulePayload, canTransitionTaskStatus } from '@/features/editing/video-task-lifecycle'
import type { PublishScheduleInput } from '@/features/editing/types'
import type { VideoMetrics } from '@/features/editing/video-metrics-model'
import { calculateEngagementRate, formatGmv } from '@/features/editing/video-metrics-model'

export type FlowValidationResult<T> = {
  valid: boolean
  data?: T
  errors: string[]
}

/** 1. 爆品雷达转入选品库：校验并换算数据 */
export function orchestrateRadarToProduct(
  radar: ProductRadarItem,
  costRatio = 0.3
): FlowValidationResult<Omit<ProductRecord, 'id' | 'createdAt'>> {
  const errors: string[] = []

  if (!radar.title || radar.title.trim().length === 0) {
    errors.push('雷达商品标题不可为空')
  }
  if (radar.salesVolume <= 0 && radar.salesAmountMinor <= 0) {
    errors.push('雷达商品销量与销售额不可同时为空')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const avgPriceMinor =
    radar.salesVolume > 0
      ? Math.round(radar.salesAmountMinor / radar.salesVolume)
      : Math.round(radar.salesAmountMinor || 1999)

  const safeCostRatio = Math.max(0.05, Math.min(costRatio, 0.95))
  const costMinor = Math.round(avgPriceMinor * safeCostRatio)

  const currency = radar.currency || 'USD'
  const costCurrency = 'CNY'
  const exchangeRate = currency === 'USD' ? 7.2 : 1.0

  const margin = calculateProductMargin({
    priceMinor: avgPriceMinor,
    currency,
    costMinor,
    costCurrency,
    exchangeRate,
  })

  return {
    valid: true,
    data: {
      name: radar.title.trim(),
      category: radar.category || '通用类目',
      priceMinor: avgPriceMinor,
      costMinor,
      currency,
      costCurrency,
      exchangeRate,
      region: radar.region || 'US',
      status: margin.marginLevel === 'loss' ? 'archived' : 'active',
    },
    errors: [],
  }
}

/** 2. 选品匹配达人并创建触达跟进记录 */
export function orchestrateProductCreatorFollowUp(params: {
  productName: string
  creator: Creator
  channel: FollowUpChannel
  operatorName: string
  notes?: string
}): FlowValidationResult<Omit<CreatorFollowUp, 'id' | 'created' | 'updated'>> {
  const errors: string[] = []

  if (!params.creator.id) {
    errors.push('未指定目标达人 ID')
  }
  if (!params.creator.isBizAvailable) {
    errors.push(`达人【${params.creator.nickname}】当前不承接商务合作 (isBizAvailable = false)`)
  }
  if (!params.productName || params.productName.trim().length === 0) {
    errors.push('合作商品名称不可为空')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const nowIso = new Date().toISOString()
  const summary = `【选品合作邀约】推荐商品：《${params.productName.trim()}》。${params.notes ? ` 备注：${params.notes}` : ''}`

  return {
    valid: true,
    data: {
      creatorId: params.creator.id,
      channel: params.channel,
      status: 'contacting',
      summary,
      contactedAt: nowIso,
      operatorName: params.operatorName || '董雨辰',
    },
    errors: [],
  }
}

/** 3. 达人合作落地生成视频制作任务 */
export type VideoTaskInitialDraft = {
  title: string
  productName: string
  creatorName: string
  creatorId: string
  region: string
  owner: string
  status: VideoTaskStatus
  dueAt: string
}

export function orchestrateCreatorToVideoTask(params: {
  creator: Creator
  productName: string
  dueDays?: number
  owner?: string
}): FlowValidationResult<VideoTaskInitialDraft> {
  const errors: string[] = []

  if (!params.creator.nickname) {
    errors.push('达人昵称不可为空')
  }
  if (!params.productName || params.productName.trim().length === 0) {
    errors.push('视频关联商品名称不可为空')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const dueDays = params.dueDays && params.dueDays > 0 ? params.dueDays : 7
  const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000)
  const dueAt = dueDate.toISOString().slice(0, 10)

  return {
    valid: true,
    data: {
      title: `${params.creator.nickname} x ${params.productName.trim()} 带货视频`,
      productName: params.productName.trim(),
      creatorName: params.creator.nickname,
      creatorId: params.creator.id,
      region: params.creator.region || 'US',
      owner: params.owner || '谢洁',
      status: 'todo',
      dueAt,
    },
    errors: [],
  }
}

/** 4. 视频任务状态推进至完成并触发排期单 */
export function orchestrateTaskToSchedule(
  currentStatus: VideoTaskStatus,
  targetStatus: VideoTaskStatus,
  task: AutoScheduleTaskSource
): FlowValidationResult<PublishScheduleInput> {
  const errors: string[] = []

  if (!canTransitionTaskStatus(currentStatus, targetStatus)) {
    errors.push(`非法状态流转：无法从【${currentStatus}】变更至【${targetStatus}】`)
    return { valid: false, errors }
  }

  if (targetStatus !== 'done') {
    return {
      valid: true,
      errors: [],
    }
  }

  const schedulePayload = buildAutoSchedulePayload(task)
  return {
    valid: true,
    data: schedulePayload,
    errors: [],
  }
}

/** 5. 表现数据打卡回流与复盘总结 */
export type VideoPerformanceEvaluation = {
  engagementRate: number
  formattedGmv: string
  isHighPerformer: boolean
  ratingLabel: '爆款标杆' | '稳健跑量' | '潜力待优化' | '表现低迷'
}

export function evaluateVideoPerformance(
  metrics: VideoMetrics,
  baselineViews = 10000,
  targetGmvCents = 500000 // 5,000.00 元基准
): VideoPerformanceEvaluation {
  const engagementRate = calculateEngagementRate(metrics)
  const formattedGmv = formatGmv(metrics.conversionGmvCents)

  const isViewsHigh = metrics.views >= baselineViews
  const isGmvHigh = metrics.conversionGmvCents >= targetGmvCents
  const isCompletionGood = metrics.completionRate >= 30

  let ratingLabel: VideoPerformanceEvaluation['ratingLabel'] = '表现低迷'
  let isHighPerformer = false

  if (isViewsHigh && (isGmvHigh || engagementRate >= 8)) {
    ratingLabel = '爆款标杆'
    isHighPerformer = true
  } else if (metrics.views >= baselineViews * 0.5 && (metrics.orderCount > 10 || isCompletionGood)) {
    ratingLabel = '稳健跑量'
  } else if (metrics.views > 1000) {
    ratingLabel = '潜力待优化'
  }

  return {
    engagementRate,
    formattedGmv,
    isHighPerformer,
    ratingLabel,
  }
}

