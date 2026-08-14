import { describe, expect, it } from 'vitest'
import {
  buildPublishScheduleItems,
  buildVideoArchiveItems,
  buildVideoTaskItems,
} from './production-model'

describe('production model', () => {
  it('maps video tasks into display rows with stable labels', () => {
    const result = buildVideoTaskItems([
      {
        id: 'task-1',
        title: '选题脚本',
        productName: '东南亚选品',
        creatorName: '磊哥',
        status: 'editing',
        dueAt: '2026-08-12 00:00:00.000Z',
        owner: '谢洁',
      },
    ])

    expect(result).toEqual([
      {
        id: 'task-1',
        title: '选题脚本',
        subtitle: '东南亚选品 · 磊哥',
        status: 'editing',
        dueAt: '2026-08-12',
        owner: '谢洁',
      },
    ])
  })

  it('maps videos into archive rows and sorts latest first', () => {
    const result = buildVideoArchiveItems([
      {
        id: 'video-1',
        title: '成片 A',
        productName: 'A',
        creatorName: '磊哥',
        publishAt: '2026-08-11 00:00:00.000Z',
        fileUrl: 'https://example.com/a.mp4',
      },
      {
        id: 'video-2',
        title: '成片 B',
        productName: 'B',
        creatorName: '雨辰',
        publishAt: '2026-08-12 00:00:00.000Z',
        fileUrl: '',
      },
    ])

    expect(result.map((item) => item.id)).toEqual(['video-2', 'video-1'])
    expect(result[0]).toMatchObject({
      title: '成片 B',
      subtitle: 'B · 雨辰',
      publishAt: '2026-08-12',
      fileUrl: '',
    })
  })

  it('maps publish schedules into rows sorted by publish time and merged subtitle', () => {
    const result = buildPublishScheduleItems([
      {
        id: 'schedule-1',
        title: '厦门沙龙切片',
        account: 'TK观察磊哥',
        platform: '微信视频号',
        region: 'CN',
        publishAt: '2026-08-11T10:00:00Z',
        status: 'published',
      },
      {
        id: 'schedule-2',
        title: '专访正片',
        account: '跨境TK磊哥',
        platform: 'TikTok',
        region: 'US',
        publishAt: '2026-08-12T10:00:00Z',
        status: 'scheduled',
      },
    ])

    expect(result.map((item) => item.id)).toEqual(['schedule-2', 'schedule-1'])
    expect(result[0]).toEqual({
      id: 'schedule-2',
      title: '专访正片',
      subtitle: 'TikTok · US',
      account: '跨境TK磊哥',
      platform: 'TikTok',
      publishAt: '2026-08-12',
      status: 'scheduled',
    })
    expect(result[1].subtitle).toBe('微信视频号 · CN')
  })
})
