/**
 * 跨境出海全主链路流水线指标聚合与健康度评估模型 (Cross-Domain Pipeline Stats Model)
 * 链路阶段：
 * 1. 爆品雷达 (Product Radar)
 * 2. 选品中心 (Product Catalog)
 * 3. 达人 CRM (Creator CRM)
 * 4. 视频矩阵 (Video Production)
 * 5. 发布排期与复盘 (Publish & Metrics Feedback)
 */

export type RawPipelineCounts = {
  radarTotal: number
  radarAdded: number
  radarExplosive: number
  productsTotal: number
  productsActive: number
  creatorsTotal: number
  creatorsSigned: number
  creatorsContacting: number
  videoTasksTotal: number
  videoTasksInProgress: number
  videoTasksDone: number
  schedulesTotal: number
  schedulesPending: number
  viralVideosCount: number
}

export type PipelineStageId = 'radar' | 'product' | 'creator' | 'video' | 'review'

export type PipelineStageSummary = {
  id: PipelineStageId
  name: string
  stageNumber: number
  metricLabel: string
  metricValue: number | string
  subText: string
  status: 'healthy' | 'attention' | 'idle'
  actionLabel: string
  actionHref: string
}

export type PipelineSummary = {
  stages: PipelineStageSummary[]
  overallHealthScore: number
  overallStatus: 'excellent' | 'normal' | 'congested'
  headline: string
  actionableInsights: string[]
}

export const DEFAULT_PIPELINE_COUNTS: RawPipelineCounts = {
  radarTotal: 0,
  radarAdded: 0,
  radarExplosive: 0,
  productsTotal: 0,
  productsActive: 0,
  creatorsTotal: 0,
  creatorsSigned: 0,
  creatorsContacting: 0,
  videoTasksTotal: 0,
  videoTasksInProgress: 0,
  videoTasksDone: 0,
  schedulesTotal: 0,
  schedulesPending: 0,
  viralVideosCount: 0,
}

export function calculatePipelineSummary(raw: RawPipelineCounts = DEFAULT_PIPELINE_COUNTS): PipelineSummary {
  const isAllZero =
    raw.radarTotal === 0 &&
    raw.productsTotal === 0 &&
    raw.creatorsTotal === 0 &&
    raw.videoTasksTotal === 0 &&
    raw.schedulesTotal === 0

  // 1. 阶段明细构建
  const stages: PipelineStageSummary[] = [
    {
      id: 'radar',
      name: '爆品雷达',
      stageNumber: 1,
      metricLabel: '监控爆品总数',
      metricValue: raw.radarTotal,
      subText: `${raw.radarExplosive} 个高热度 · ${raw.radarAdded} 个已转选品`,
      status: raw.radarTotal === 0 ? 'idle' : 'healthy' as const,
      actionLabel: '选品雷达',
      actionHref: '/market',
    },
    {
      id: 'product',
      name: '选品中心',
      stageNumber: 2,
      metricLabel: '储备/在售选品',
      metricValue: raw.productsTotal,
      subText: `${raw.productsActive} 个在售 · USD/CNY毛利已核算`,
      status: raw.productsTotal === 0 ? 'idle' : 'healthy',
      actionLabel: '选品管理',
      actionHref: '/market',
    },
    {
      id: 'creator',
      name: '达人CRM',
      stageNumber: 3,
      metricLabel: '建联合作达人',
      metricValue: raw.creatorsTotal,
      subText: `${raw.creatorsSigned} 位签约 · ${raw.creatorsContacting} 位沟通中`,
      status: raw.creatorsTotal === 0 ? 'idle' : 'healthy',
      actionLabel: '商务跟进',
      actionHref: '/business',
    },
    {
      id: 'video',
      name: '视频矩阵',
      stageNumber: 4,
      metricLabel: '视频制作任务',
      metricValue: raw.videoTasksTotal,
      subText: `${raw.videoTasksInProgress} 个制作中 · ${raw.videoTasksDone} 个已成片`,
      status:
        raw.videoTasksInProgress > 12
          ? 'attention'
          : raw.videoTasksTotal === 0
            ? 'idle'
            : 'healthy',
      actionLabel: '剪辑工坊',
      actionHref: '/editing',
    },
    {
      id: 'review',
      name: '排期与复盘',
      stageNumber: 5,
      metricLabel: '发布与打卡',
      metricValue: raw.schedulesTotal,
      subText: `${raw.schedulesPending} 待发布 · ${raw.viralVideosCount} 爆款标杆`,
      status: raw.schedulesTotal === 0 ? 'idle' : 'healthy',
      actionLabel: '排期打卡',
      actionHref: '/editing',
    },
  ]

  // 2. 洞察建议生成
  const actionableInsights: string[] = []
  if (raw.radarTotal > 0 && raw.radarAdded === 0) {
    actionableInsights.push('雷达库有新抓取爆品尚未转化为选品，建议筛选高热度一键入库')
  }
  if (raw.productsTotal > 0 && raw.creatorsContacting === 0 && raw.creatorsSigned === 0) {
    actionableInsights.push('选品库已有商品，但暂无达人触达邀约，建议匹配类目达人开启跟进')
  }
  if (raw.videoTasksInProgress > 10) {
    actionableInsights.push('制作中视频任务积压较多，建议利用 AI 智能切片工作坊提效出片')
  }
  if (raw.schedulesPending > 0) {
    actionableInsights.push(`当前有 ${raw.schedulesPending} 条视频待发布打卡，请各站点编导留意定时发布`)
  }

  // 3. 全链路流转健康度计算 (0 ~ 100)
  if (isAllZero) {
    return {
      stages,
      overallHealthScore: 60,
      overallStatus: 'normal',
      headline: '主链路待数据激活，全流程就绪',
      actionableInsights: ['从爆品雷达或达人CRM录入初始业务数据，即可全面激活出海全链路。'],
    }
  }

  let score = 50
  if (raw.radarTotal > 0) score += 10
  if (raw.radarAdded > 0) score += 8
  if (raw.productsTotal > 0) score += 10
  if (raw.creatorsSigned > 0) score += 8
  if (raw.videoTasksDone > 0) score += 8
  if (raw.viralVideosCount > 0) score += 6

  // 惩罚积压
  if (raw.videoTasksInProgress > 15) score -= 8

  const overallHealthScore = Math.max(20, Math.min(100, score))
  const overallStatus =
    overallHealthScore >= 80 ? 'excellent' : overallHealthScore >= 60 ? 'normal' : 'congested'

  const headline =
    overallStatus === 'excellent'
      ? '跨境出海全主链路运转强劲，流转闭环通畅'
      : overallStatus === 'normal'
        ? '出海业务链路稳步运转，部分环节存在提速空间'
        : '主链路部分阶段存在积压或待补齐，需重点推进'

  return {
    stages,
    overallHealthScore,
    overallStatus,
    headline,
    actionableInsights: actionableInsights.length > 0 ? actionableInsights : ['全链路各阶段配比均衡，继续保持当前推进节奏。'],
  }
}
