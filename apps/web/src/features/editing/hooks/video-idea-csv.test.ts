import { describe, expect, it } from 'vitest'
import {
  exportVideoIdeaCsvFailures,
  formatImportFeedback,
  isVideoIdeaCsvPreflightImportable,
  parseVideoIdeaCsvText,
} from './video-idea-csv'

const header =
  '标题,账号,视频类型,播放量,完播率,涨粉,点赞,评论,转发,发布日期,标签,内容简述'

describe('video idea CSV preflight', () => {
  it('reports imported, updated, skipped, and failed rows for manual confirmation', () => {
    expect(
      formatImportFeedback({
        newCount: 2,
        updatedCount: 1,
        skippedCount: 3,
        failureCount: 4,
      })
    ).toContain('新增 2 条，更新 1 条，跳过 3 条重复数据，失败 4 条')
  })

  it('rejects files missing required columns before any mutation', () => {
    expect(() => parseVideoIdeaCsvText('标题,账号\n测试,账号A')).toThrow(
      'CSV 缺少必需列：视频类型、发布日期'
    )
  })

  it('collects invalid rows and continues parsing valid rows', () => {
    const csv = `${header}
视频A,跨境TK磊哥,口播,100,50,10,20,3,2,2026-08-24,标签,正常
视频B,跨境TK磊哥,口播,-1,50,10,20,3,2,2026-08-25,标签,负数
视频C,跨境TK磊哥,口播,100,101,10,20,3,2,2026-08-26,标签,超限`
    const result = parseVideoIdeaCsvText(csv)

    expect(result.rows.map((row) => row.title)).toEqual(['视频A'])
    expect(result.failedCount).toBe(2)
    expect(result.failures.map((failure) => failure.rowNumber)).toEqual([3, 4])
    expect(result.failures[0]?.reason).toContain('播放量')
    expect(result.totalRows).toBe(
      result.validCount + result.skippedCount + result.failedCount
    )
  })

  it('counts repeated title and publish date rows as skipped duplicates', () => {
    const csv = `${header}
视频A,跨境TK磊哥,口播,100,50,10,20,3,2,2026-08-24,标签,第一次
视频A,跨境TK磊哥,口播,200,60,20,30,4,3,2026-08-24,标签,重复
视频B,跨境TK磊哥,口播,100,50,10,20,3,2,2026-08-25,标签,正常`
    const result = parseVideoIdeaCsvText(csv)

    expect(result.rows.map((row) => row.title)).toEqual(['视频A', '视频B'])
    expect(result.skippedCount).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(result.totalRows).toBe(3)
  })

  it('blocks submission when every row fails validation', () => {
    const csv = `${header}
视频A,未知账号,口播,100,50,10,20,3,2,2026-08-24,标签,账号错误
视频B,跨境TK磊哥,未知类型,100,50,10,20,3,2,2026-08-25,标签,类型错误`
    const result = parseVideoIdeaCsvText(csv)

    expect(result.validCount).toBe(0)
    expect(result.failedCount).toBe(2)
    expect(isVideoIdeaCsvPreflightImportable(result)).toBe(false)
  })

  it('exports failed rows with row numbers and reasons', () => {
    const csv = `${header}
视频A,跨境TK磊哥,口播,-1,50,10,20,3,2,2026-08-24,标签,负数`
    const result = parseVideoIdeaCsvText(csv)
    const exported = exportVideoIdeaCsvFailures(result.failures)

    expect(exported).toContain('行号,失败原因')
    expect(exported).toContain('视频A')
    expect(exported).toContain('播放量必须是大于等于 0 的整数')
  })
})
