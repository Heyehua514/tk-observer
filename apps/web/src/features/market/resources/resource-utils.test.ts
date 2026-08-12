import { describe, expect, it } from 'vitest'
import {
  applyTemplate,
  financesToCsv,
  financesToMarkdown,
} from './resource-utils'
import type { EventFinance } from './types'

const rows: EventFinance[] = [
  {
    id: '1',
    eventId: 'event',
    eventName: '厦门沙龙',
    category: 'sponsorship_income',
    type: 'income',
    amount: 10000,
    description: '主赞助,含展位',
    paidBy: '品牌方',
    paidAt: '2026-08-06',
  },
  {
    id: '2',
    eventId: 'event',
    eventName: '厦门沙龙',
    category: 'venue',
    type: 'expense',
    amount: 2500,
    description: '场地|布置',
    paidBy: '韩素云',
    paidAt: '2026-08-06',
  },
]

describe('market resource deterministic transforms', () => {
  it('replaces known placeholders and preserves unknown placeholders', () => {
    expect(
      applyTemplate('{{活动名称}}在{{城市}}举办，{{未知字段}}', {
        活动名称: '金鳞会',
        城市: '厦门',
      })
    ).toBe('金鳞会在厦门举办，{{未知字段}}')
  })

  it('exports quoted CSV cells without losing commas', () => {
    const csv = financesToCsv(rows)
    expect(csv).toContain('"金额(人民币)"')
    expect(csv).toContain('"¥100.00"')
    expect(csv).toContain('"主赞助,含展位"')
    expect(csv.split('\n')).toHaveLength(3)
  })

  it('calculates finance totals in Markdown and escapes table pipes', () => {
    const markdown = financesToMarkdown(rows, '厦门沙龙复盘')
    expect(markdown).toContain('利润：¥75.00')
    expect(markdown).toContain('金额（人民币）')
    expect(markdown).toContain('利润率：75.0%')
    expect(markdown).toContain('场地\\|布置')
  })
})
