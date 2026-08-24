import { describe, expect, it } from 'vitest'
import {
  filterIntelligenceItems,
  isSafeExternalUrl,
  parseIntelligenceCsv,
  validateIntelligenceDraft,
  type IntelligenceItem,
} from './intelligence-model'

const base: IntelligenceItem = {
  id: 'item-1',
  title: '行业公告',
  summary: '摘要',
  sourceName: '官方来源',
  sourceType: 'official',
  sourceUrl: 'https://example.com/news',
  capturedAt: '2026-08-24T01:00:00.000Z',
  region: '中国',
  language: 'zh-CN',
  topic: '行业',
  heatScore: 80,
  confidence: 0.9,
  dedupeKey: 'official:news-1',
  workspaces: ['market'],
  status: 'unread',
  createdBy: 'owner-1',
  createdAt: '2026-08-24T01:00:00.000Z',
}

describe('intelligence model', () => {
  it('only accepts http and https external URLs', () => {
    expect(isSafeExternalUrl('https://example.com')).toBe(true)
    expect(isSafeExternalUrl('http://example.com')).toBe(true)
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('/internal/path')).toBe(false)
  })

  it('reports required fields and unsafe URLs', () => {
    expect(
      validateIntelligenceDraft({
        title: '',
        sourceName: '',
        sourceType: 'manual',
        sourceUrl: 'javascript:bad',
        capturedAt: '',
        dedupeKey: '',
      })
    ).toEqual([
      '标题不能为空',
      '来源不能为空',
      '原文链接必须是 http 或 https 地址',
      '采集时间不能为空',
      '去重键不能为空',
    ])
  })

  it('filters by keyword, workspace and status', () => {
    expect(
      filterIntelligenceItems(
        [base, { ...base, id: 'item-2', title: '市场趋势', workspaces: ['editing'], status: 'saved' }],
        { query: '市场', workspace: 'editing', status: 'saved' }
      ).map((item) => item.id)
    ).toEqual(['item-2'])
  })

  it('parses valid CSV rows and reports invalid rows without partial output', () => {
    expect(parseIntelligenceCsv('标题,来源,链接,采集时间,去重键\n公告,官方,https://example.com/a,2026-08-24T01:00:00Z,key-a')).toEqual({
      rows: [{ title: '公告', sourceName: '官方', sourceUrl: 'https://example.com/a', capturedAt: '2026-08-24T01:00:00Z', dedupeKey: 'key-a' }], errors: [],
    })
    expect(parseIntelligenceCsv('标题,来源,链接,采集时间,去重键\n坏数据,来源,javascript:bad,,key-b')).toEqual({
      rows: [], errors: ['第 2 行：原文链接必须是 http 或 https 地址', '第 2 行：采集时间不能为空'],
    })
  })
})
