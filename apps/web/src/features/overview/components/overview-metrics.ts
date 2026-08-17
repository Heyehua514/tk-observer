/** 总览经营指标：统一人民币口径与北京日历时间范围筛选。 */
export type OverviewMetricRange = '7d' | '30d' | 'all'

export const CNY_ACCOUNTING_NOTE =
  '统一人民币口径：金额以分存储，前端按人民币元展示。'

const rangeDays: Record<Exclude<OverviewMetricRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
}

function beijingDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function beijingStart(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00+08:00`).getTime()
}

export function filterGmvMetricsByRange<T extends { metricDate: string }>(
  metrics: readonly T[],
  range: OverviewMetricRange,
  now = new Date()
): T[] {
  if (range === 'all') return [...metrics]
  const start = new Date(`${beijingDateKey(now)}T00:00:00+08:00`)
  start.setUTCDate(start.getUTCDate() - (rangeDays[range] - 1))
  const cutoff = start.getTime()

  return metrics.filter((metric) => beijingStart(metric.metricDate) >= cutoff)
}
