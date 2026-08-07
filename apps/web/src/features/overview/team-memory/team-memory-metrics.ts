/** 团队记忆指标纯函数；本月口径固定为北京时间。 */
import type { TeamMemoryFailedCase, TeamMemoryMetrics } from './types'

function beijingMonth(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || ''
  const month = parts.find((part) => part.type === 'month')?.value || ''
  return `${year}-${month}`
}

export function calculateTeamMemoryMetrics(
  failedCases: TeamMemoryFailedCase[],
  cronRuns: number,
  templateUsageCounts: number[],
  now = new Date()
): TeamMemoryMetrics {
  const currentMonth = beijingMonth(now)
  const currentCases = failedCases.filter(
    (item) => beijingMonth(item.recordedAt) === currentMonth
  )
  const grouped = new Map<string, number>()
  for (const item of currentCases) {
    const reason = item.reason.trim() || '未填写原因'
    grouped.set(reason, (grouped.get(reason) || 0) + 1)
  }
  return {
    topLessons: [...grouped.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
      .slice(0, 3),
    loop: {
      cronRuns,
      templateUses: templateUsageCounts.reduce((sum, count) => sum + count, 0),
      failedCases: currentCases.length,
    },
  }
}
