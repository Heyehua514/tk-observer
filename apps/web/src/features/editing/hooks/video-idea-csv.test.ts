import { describe, expect, it } from 'vitest'
import { formatImportFeedback } from './video-idea-csv'

describe('formatImportFeedback', () => {
  it('reports successful and duplicate counts with manual confirmation guidance', () => {
    expect(formatImportFeedback({ newCount: 2, skippedCount: 1 })).toContain(
      '新增 2 条，跳过 1 条重复数据'
    )
    expect(formatImportFeedback({ newCount: 2, skippedCount: 1 })).toContain(
      '人工确认'
    )
  })
})
