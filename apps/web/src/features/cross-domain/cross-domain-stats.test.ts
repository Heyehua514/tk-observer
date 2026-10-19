import { describe, expect, it } from 'vitest'
import {
  calculatePipelineSummary,
  DEFAULT_PIPELINE_COUNTS,
  type RawPipelineCounts,
} from './cross-domain-stats'

describe('cross-domain-stats', () => {
  it('returns baseline initialization status when all counts are zero', () => {
    const summary = calculatePipelineSummary(DEFAULT_PIPELINE_COUNTS)

    expect(summary.stages).toHaveLength(5)
    expect(summary.overallHealthScore).toBe(60)
    expect(summary.overallStatus).toBe('normal')
    expect(summary.headline).toContain('主链路待数据激活')
    expect(summary.stages[0].status).toBe('idle')
    expect(summary.stages[3].status).toBe('idle')
  })

  it('calculates excellent health score when pipeline flows smoothly', () => {
    const raw: RawPipelineCounts = {
      radarTotal: 40,
      radarAdded: 15,
      radarExplosive: 12,
      productsTotal: 15,
      productsActive: 12,
      creatorsTotal: 25,
      creatorsSigned: 8,
      creatorsContacting: 10,
      videoTasksTotal: 20,
      videoTasksInProgress: 5,
      videoTasksDone: 14,
      schedulesTotal: 14,
      schedulesPending: 3,
      viralVideosCount: 4,
    }

    const summary = calculatePipelineSummary(raw)

    expect(summary.overallHealthScore).toBeGreaterThanOrEqual(80)
    expect(summary.overallStatus).toBe('excellent')
    expect(summary.stages[0].status).toBe('healthy')
    expect(summary.stages[3].status).toBe('healthy')
    expect(summary.stages[4].subText).toContain('3 待发布')
  })

  it('flags attention on video stage when tasks are congested', () => {
    const raw: RawPipelineCounts = {
      radarTotal: 20,
      radarAdded: 5,
      radarExplosive: 2,
      productsTotal: 8,
      productsActive: 6,
      creatorsTotal: 10,
      creatorsSigned: 2,
      creatorsContacting: 4,
      videoTasksTotal: 30,
      videoTasksInProgress: 18, // 积压严重
      videoTasksDone: 2,
      schedulesTotal: 2,
      schedulesPending: 1,
      viralVideosCount: 0,
    }

    const summary = calculatePipelineSummary(raw)

    expect(summary.stages[3].status).toBe('attention')
    expect(summary.actionableInsights.some((s) => s.includes('智能切片'))).toBe(true)
  })

  it('generates radar and outreach actionable insights when bottlenecks exist', () => {
    const raw: RawPipelineCounts = {
      radarTotal: 10,
      radarAdded: 0, // 未转化
      radarExplosive: 5,
      productsTotal: 5,
      productsActive: 5,
      creatorsTotal: 0, // 暂无达人
      creatorsSigned: 0,
      creatorsContacting: 0,
      videoTasksTotal: 0,
      videoTasksInProgress: 0,
      videoTasksDone: 0,
      schedulesTotal: 0,
      schedulesPending: 0,
      viralVideosCount: 0,
    }

    const summary = calculatePipelineSummary(raw)

    expect(summary.actionableInsights.some((s) => s.includes('雷达库有新抓取爆品尚未转化为选品'))).toBe(true)
    expect(summary.actionableInsights.some((s) => s.includes('选品库已有商品，但暂无达人触达邀约'))).toBe(true)
  })
})
