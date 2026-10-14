import { describe, expect, it } from 'vitest'
import type { ProductRadarItem } from '@/features/market/radar/types'
import type { Creator } from '@/features/business/types'
import {
  evaluateVideoPerformance,
  orchestrateCreatorToVideoTask,
  orchestrateProductCreatorFollowUp,
  orchestrateRadarToProduct,
  orchestrateTaskToSchedule,
} from './lifecycle-orchestrator'

describe('cross-domain lifecycle orchestrator', () => {
  const sampleRadar: ProductRadarItem = {
    id: 'radar-test-01',
    title: '智能磁吸车载手机支架',
    category: '3C数码',
    region: 'US',
    sourcePlatform: 'tiktok_shop',
    sourceUrl: 'https://shop.tiktok.com/view/1001',
    salesVolume: 2000,
    salesAmountMinor: 4000000,
    currency: 'USD',
    heatScore: 92,
    growthRate: 150.5,
    tags: ['汽车好物', '爆款'],
    isAddedToProducts: false,
    notes: '转化率高',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  }

  const sampleCreator: Creator = {
    id: 'creator-test-01',
    nickname: '跨境TK带货达人',
    tiktokUrl: 'https://tiktok.com/@creator01',
    followers: 120000,
    region: 'US',
    cooperationStatus: 'contacting',
    commissionRate: 15,
    owner: '董雨辰',
    isBizAvailable: true,
    cooperationPrice: 50000,
    cooperationNotes: '沟通积极',
    created: '2026-10-01T00:00:00Z',
    updated: '2026-10-01T00:00:00Z',
  }

  describe('orchestrateRadarToProduct', () => {
    it('successfully transforms radar item into product catalog entry with correct pricing', () => {
      const result = orchestrateRadarToProduct(sampleRadar, 0.3)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('智能磁吸车载手机支架')
      expect(result.data?.priceMinor).toBe(2000)
      expect(result.data?.costMinor).toBe(600)
      expect(result.data?.currency).toBe('USD')
      expect(result.data?.costCurrency).toBe('CNY')
      expect(result.data?.exchangeRate).toBe(7.2)
      expect(result.data?.status).toBe('active')
    })

    it('validates invalid radar items defensively', () => {
      const invalid = { ...sampleRadar, title: '', salesVolume: 0, salesAmountMinor: 0 }
      const result = orchestrateRadarToProduct(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
      expect(result.errors).toContain('雷达商品标题不可为空')
    })
  })

  describe('orchestrateProductCreatorFollowUp', () => {
    it('creates outreach follow-up for biz-available creators', () => {
      const result = orchestrateProductCreatorFollowUp({
        productName: '智能磁吸车载手机支架',
        creator: sampleCreator,
        channel: 'email',
        operatorName: '董雨辰',
        notes: '提供样品测试',
      })
      expect(result.valid).toBe(true)
      expect(result.data?.creatorId).toBe('creator-test-01')
      expect(result.data?.channel).toBe('email')
      expect(result.data?.status).toBe('contacting')
      expect(result.data?.summary).toContain('智能磁吸车载手机支架')
      expect(result.data?.summary).toContain('提供样品测试')
    })

    it('rejects creators who do not accept business cooperation', () => {
      const unavailableCreator = { ...sampleCreator, isBizAvailable: false }
      const result = orchestrateProductCreatorFollowUp({
        productName: '智能磁吸车载手机支架',
        creator: unavailableCreator,
        channel: 'whatsapp',
        operatorName: '董雨辰',
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('当前不承接商务合作')
    })
  })

  describe('orchestrateCreatorToVideoTask', () => {
    it('drafts a video editing task bound to creator and product', () => {
      const result = orchestrateCreatorToVideoTask({
        creator: sampleCreator,
        productName: '智能磁吸车载手机支架',
        dueDays: 5,
        owner: '谢洁',
      })
      expect(result.valid).toBe(true)
      expect(result.data?.creatorId).toBe('creator-test-01')
      expect(result.data?.title).toBe('跨境TK带货达人 x 智能磁吸车载手机支架 带货视频')
      expect(result.data?.status).toBe('todo')
      expect(result.data?.owner).toBe('谢洁')
      expect(result.data?.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('rejects task creation if product name is blank', () => {
      const result = orchestrateCreatorToVideoTask({
        creator: sampleCreator,
        productName: '   ',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('视频关联商品名称不可为空')
    })
  })

  describe('orchestrateTaskToSchedule', () => {
    it('generates publish schedule automatically when task status transitions to done', () => {
      const result = orchestrateTaskToSchedule('review', 'done', {
        id: 'task-888',
        title: '车载支架带货视频',
        region: 'US',
        dueAt: '2026-10-25',
      })
      expect(result.valid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.videoTaskId).toBe('task-888')
      expect(result.data?.title).toBe('车载支架带货视频')
      expect(result.data?.status).toBe('scheduled')
    })

    it('blocks illegal status transition according to state machine', () => {
      const result = orchestrateTaskToSchedule('todo', 'review', {
        id: 'task-888',
        title: '车载支架带货视频',
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('非法状态流转')
    })
  })

  describe('evaluateVideoPerformance', () => {
    it('evaluates high performing video as benchmark', () => {
      const evaluation = evaluateVideoPerformance({
        views: 25000,
        likes: 2200,
        comments: 300,
        shares: 150,
        completionRate: 35.5,
        conversionGmvCents: 890000,
        orderCount: 120,
      })
      expect(evaluation.isHighPerformer).toBe(true)
      expect(evaluation.ratingLabel).toBe('爆款标杆')
      expect(evaluation.formattedGmv).toBe('8,900.00')
      expect(evaluation.engagementRate).toBe(10.6)
    })

    it('evaluates standard video gracefully', () => {
      const evaluation = evaluateVideoPerformance({
        views: 6000,
        likes: 120,
        comments: 15,
        shares: 5,
        completionRate: 28.0,
        conversionGmvCents: 120000,
        orderCount: 15,
      })
      expect(evaluation.isHighPerformer).toBe(false)
      expect(evaluation.ratingLabel).toBe('稳健跑量')
    })
  })
})
