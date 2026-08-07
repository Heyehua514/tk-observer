/** 市场活动指标纯函数；用于详情页和 gate tests。 */
import type { ActivityMetrics, ActivityRelatedRecord } from './types'

export function calculateActivityMetrics(
  tasks: ActivityRelatedRecord[],
  registrations: ActivityRelatedRecord[],
  sponsorships: ActivityRelatedRecord[],
  finances: ActivityRelatedRecord[]
): ActivityMetrics {
  const income = finances
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0)
  const expense = finances
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0)
  return {
    taskTotal: tasks.length,
    taskDone: tasks.filter((item) => item.status === 'done').length,
    confirmedRegistrations: registrations.filter(
      (item) => item.status === 'confirmed'
    ).length,
    signedSponsorship: sponsorships
      .filter((item) => item.stage === 'signed')
      .reduce((sum, item) => sum + (item.amount || 0), 0),
    income,
    expense,
    profit: income - expense,
  }
}
