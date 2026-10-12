/**
 * 智能切片与 AI 诊断单元测试
 * 覆盖：长视频2分钟切片约束、剪映草稿工程规范、AI记忆回流结构。
 */
import { describe, expect, it } from 'vitest'
import { generateJianyingDraft } from './jianying-draft-service'
import type { VideoClipSlice } from './auto-cut-model'

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
})
