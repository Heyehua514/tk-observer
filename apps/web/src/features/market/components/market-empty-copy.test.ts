/** 市场工作台空态文案自检。 */
import { describe, expect, it } from 'vitest'
import { marketEmptyTitles } from './market-empty-copy'

describe('market empty copy', () => {
  it('uses guided titles for module-level empty states', () => {
    expect(Object.values(marketEmptyTitles)).toEqual([
      '等待商品入库',
      '等待活动排期创建',
      '等待场地资源沉淀',
    ])
    for (const title of Object.values(marketEmptyTitles)) {
      expect(title).not.toContain('暂无')
    }
  })
})
