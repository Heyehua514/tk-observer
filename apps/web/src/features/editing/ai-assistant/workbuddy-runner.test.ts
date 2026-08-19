import { describe, expect, it } from 'vitest'
import {
  buildVideoAnalysisPrompt,
  parseVideoAnalysisJson,
} from './workbuddy-runner'

describe('buildVideoAnalysisPrompt', () => {
  it('内嵌视频数据并要求 JSON 逐条洞察', () => {
    const prompt = buildVideoAnalysisPrompt([
      { id: 'v1', title: 'AI 带货', videoType: '口播', publishDate: '2026-08-01', views: 1000 },
    ])
    expect(prompt).toContain('AI 带货')
    expect(prompt).toContain('"videos"')
    expect(prompt).toContain('"titlePatterns"')
  })
})

describe('parseVideoAnalysisJson', () => {
  it('解析逐条洞察与规律', () => {
    const raw = '```json\n{"videos":[{"id":"v1","insight":"数字开头"}] ,"titlePatterns":["含数字"],"publishTimePatterns":["傍晚"],"contentTypePreferences":["口播"],"summary":"结论"}\n```'
    expect(parseVideoAnalysisJson(raw)).toEqual({
      videos: [{ id: 'v1', insight: '数字开头' }],
      titlePatterns: ['含数字'],
      publishTimePatterns: ['傍晚'],
      contentTypePreferences: ['口播'],
      summary: '结论',
    })
  })

  it('无法解析时抛错', () => {
    expect(() => parseVideoAnalysisJson('对不起，无法分析')).toThrow()
  })
})
