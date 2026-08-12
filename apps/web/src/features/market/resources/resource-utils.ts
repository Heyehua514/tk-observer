import type { EventFinance } from './types'
import { formatFinanceCny } from './finance-format'

export function applyTemplate(
  content: string,
  values: Record<string, string | number>
) {
  return content.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, key: string) => {
    const value = values[key.trim()]
    return value === undefined ? match : String(value)
  })
}

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`

export function financesToCsv(rows: EventFinance[]) {
  const header = [
    '活动',
    '收支类型',
    '类别',
    '金额(人民币)',
    '说明',
    '经手人',
    '日期',
  ]
  return [
    header.map(csvCell).join(','),
    ...rows.map((row) =>
      [
        row.eventName,
        row.type,
        row.category,
        formatFinanceCny(row.amount),
        row.description,
        row.paidBy,
        row.paidAt,
      ]
        .map(csvCell)
        .join(',')
    ),
  ].join('\n')
}

export function financesToMarkdown(
  rows: EventFinance[],
  title = '活动财务复盘'
) {
  const income = rows
    .filter((row) => row.type === 'income')
    .reduce((sum, row) => sum + row.amount, 0)
  const expense = rows
    .filter((row) => row.type === 'expense')
    .reduce((sum, row) => sum + row.amount, 0)
  const profit = income - expense
  const rate = income > 0 ? `${((profit / income) * 100).toFixed(1)}%` : '0.0%'
  const details = rows.length
    ? rows
        .map(
          (row) =>
            `| ${row.eventName} | ${row.type} | ${row.category} | ${formatFinanceCny(row.amount)} | ${row.description.replace(/\|/g, '\\|')} |`
        )
        .join('\n')
    : '| - | - | - | ¥0.00 | 暂无明细 |'
  return `# ${title}\n\n- 收入总计：${formatFinanceCny(income)}\n- 支出总计：${formatFinanceCny(expense)}\n- 利润：${formatFinanceCny(profit)}\n- 利润率：${rate}\n\n| 活动 | 类型 | 类别 | 金额（人民币） | 说明 |\n| --- | --- | --- | ---: | --- |\n${details}\n`
}

export function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
