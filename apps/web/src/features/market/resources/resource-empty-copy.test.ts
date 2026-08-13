/** 市场资源库空态文案自检。 */
import { describe, expect, it } from 'vitest'
import { marketResourceEmptyTitles } from './resource-empty-copy'

describe('market resource empty copy', () => {
  it('uses guided titles instead of static empty placeholders', () => {
    expect(Object.values(marketResourceEmptyTitles)).toEqual([
      '等待文案模板沉淀',
      '等待活动物料上传',
      '等待财务明细录入',
    ])
    for (const title of Object.values(marketResourceEmptyTitles)) {
      expect(title).not.toContain('暂无')
    }
  })
})
