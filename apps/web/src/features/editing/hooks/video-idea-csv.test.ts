import { describe, expect, it } from 'vitest'
import {
  formatImportFeedback,
  parseVideoIdeaCsvText,
  preflightVideoIdeaCsv,
} from './video-idea-csv'

const header =
  '标题,账号,视频类型,播放量,完播率,涨粉,点赞,评论,转发,发布日期,标签,内容简述'

describe('video idea CSV preflight', () => {
  it('reports inserted, updated, and skipped rows for manual confirmation', () => {
    expect(
      formatImportFeedback({ newCount: 2, updatedCount: 1, skippedCount: 3 })
    ).toContain('新增 2 条，更新 1 条，跳过 3 条重复数据')
  })

  it('rejects files missing required columns before any mutation', () => {
    expect(() => parseVideoIdeaCsvText('标题,账号\n测试,账号A')).toThrow(
      'CSV 缺少必需列：视频类型、发布日期'
    )
  })

  it('rejects duplicate title and publish date keys', () => {
    const csv = `${header}\n视频A,跨境TK磊哥,口播,1,1,0,0,0,0,2026-08-24,,\n视频A,跨境TK磊哥,口播,2,2,0,0,0,0,2026-08-24,,`
    const rows = parseVideoIdeaCsvText(csv)
    expect(() => preflightVideoIdeaCsv(rows)).toThrow('CSV 存在重复视频')
  })
})
