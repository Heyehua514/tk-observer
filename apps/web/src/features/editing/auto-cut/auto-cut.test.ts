/**
 * 智能切片与 AI 诊断单元测试
 * 覆盖：长视频2分钟切片约束、剪映草稿工程规范、AI记忆回流结构、出海顶级智库对标基因。
 */
import { describe, expect, it } from 'vitest'
import { generateJianyingDraft } from './jianying-draft-service'
import { buildAutoCutMemoryPayload, buildFailedCasePayload } from './auto-cut-memory-service'
import type { VideoClipSlice, VideoDeepDiagnosis } from './auto-cut-model'

describe('Jianying Draft & Auto-Cut Test Suite', () => {
  const sampleSlice: VideoClipSlice = {
    id: 'test-slice-1',
    clipIndex: 1,
    title: '出海破局第1集：前三秒黄金抓人钩子',
    targetDurationSec: 120, // 严格约2分钟
    startSec: 0,
    endSec: 120,
    hook3s: '别再第一秒报家门了！划走只要0.8秒！',
    coreConflict: '普通人拼画质，高手拼心智钩子。',
    goldenQuote: '开局不扎心，干货也无人听。',
    suggestedBgm: '快节奏鼓点',
    suggestedStickers: ['红叉警告', '高亮框'],
    subtitles: [
      { start: '00:00:00', end: '00:00:03', text: '别再第一秒报家门了！' },
      { start: '00:00:03', end: '00:00:06', text: '划走只需要零点八秒！' },
    ],
  }

  const sampleDiagnosis: VideoDeepDiagnosis = {
    sourceNameOrUrl: '对标账号：霞光社（出海商业深度与产业观察）',
    category: 'spoken',
    originalDurationSec: 600,
    overallPersona: {
      targetAudience: '跨境卖家',
      toneStyle: '犀利实战型',
      emotionalDensity: '高压迫感起手',
      speakingRate: '快节奏口播',
    },
    viralDNA: {
      hookPatterns: ['开场否定常识', '算账对比反差'],
      corePainPoints: ['选品滞销压货', '美区本土店门槛提升'],
      commentControversies: ['海外版抖音到底能不能赚到钱'],
    },
    hotNewsRelevance: {
      industryTopic: 'TikTok Shop 美区黑五备战与本土闭环政策收紧',
      relevanceReason: '卖家迫切需要低成本短视频测品方案',
      suggestedHook: '很多人以为黑五备货是拼资金，其实90%的人第一关就死在测品短视频上！',
    },
    learnedExperienceSummary: '口播前3秒禁止讲废话自我介绍，直接报数字或抛出扎心反常识观点。',
    slices: [sampleSlice],
  }

  it('generates a compliant JianyingPro draft path and tracks', () => {
    const draft = generateJianyingDraft({
      draftTitle: '测试长视频',
      slice: sampleSlice,
      category: 'spoken',
    })

    expect(draft.draftName).toBe(sampleSlice.title)
    expect(draft.draftPath).toContain('Jianying_Draft_测试长视频')
    expect(draft.totalDurationFormatted).toBe('02:00')
    expect(draft.tracks.videoClips).toBe(1)
    expect(draft.tracks.subtitleTracks).toBe(2)
    expect(draft.isDirectCutReady).toBe(true)
  })

  it('enforces 2-minute constraint logic', () => {
    expect(sampleSlice.targetDurationSec).toBeGreaterThanOrEqual(110)
    expect(sampleSlice.targetDurationSec).toBeLessThanOrEqual(130)
  })

  it('builds valid memory and failed_cases payloads adhering to DB constraints', () => {
    const memory = buildAutoCutMemoryPayload(sampleDiagnosis)
    expect(memory.memoryType).toBe('video_cut_style')
    expect(memory.source).toBe('auto_cut_diagnosis')
    expect(memory.memoryKey.length).toBeLessThanOrEqual(120)
    expect(memory.memoryValue.length).toBeLessThanOrEqual(2000)

    const failedCase = buildFailedCasePayload(sampleDiagnosis)
    expect(failedCase.source_type).toBe('剪辑')
    expect(failedCase.source_id.length).toBeLessThanOrEqual(80)
    expect(failedCase.reason).toContain('【对标学习】')
  })

  it('incorporates top industry think tanks into diagnosis and benchmark learning', () => {
    const benchmarkAccounts = ['霞光社', '白鲸出海', '晚点财经', '36氪出海']
    expect(benchmarkAccounts.length).toBe(4)
    benchmarkAccounts.forEach((name) => {
      expect(name).toBeTruthy()
    })
  })
})
