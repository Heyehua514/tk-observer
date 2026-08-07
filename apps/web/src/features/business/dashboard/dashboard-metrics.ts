/** 商务驾驶舱指标纯函数；所有周期口径固定使用北京时间。 */
import type { BusinessDashboardData, BusinessDashboardSummary } from './types'

const closedStages = new Set(['won', 'lost'])
const publishedStatuses = new Set(['published', 'completed'])
const DAY_MS = 86_400_000

function beijingDateParts(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0)
  return { year: get('year'), month: get('month'), day: get('day') }
}

function isSameBeijingMonth(value: string, now: Date) {
  const date = beijingDateParts(value)
  const current = beijingDateParts(now)
  return Boolean(
    date &&
    current &&
    date.year === current.year &&
    date.month === current.month
  )
}

function daySerial(value: Date | string) {
  const parts = beijingDateParts(value)
  return parts
    ? Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS
    : null
}

export function calculateBusinessDashboard(
  data: BusinessDashboardData,
  now = new Date()
): BusinessDashboardSummary {
  const activeOpportunities = data.opportunities.filter(
    (item) => !closedStages.has(item.stage)
  )
  const today = daySerial(now)
  const actions = activeOpportunities
    .flatMap((item) => {
      const due = daySerial(item.expectedClose)
      if (due === null || today === null) return []
      const daysUntilDue = due - today
      if (daysUntilDue > 7) return []
      return [
        {
          ...item,
          urgency:
            daysUntilDue < 0 ? ('overdue' as const) : ('due_soon' as const),
          daysUntilDue,
        },
      ]
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  return {
    ...data,
    metrics: {
      totalClients: data.clients.length,
      newClientsThisMonth: data.clients.filter((item) =>
        isSameBeijingMonth(item.created, now)
      ).length,
      activeOpportunities: activeOpportunities.length,
      activeOpportunityAmount: activeOpportunities.reduce(
        (sum, item) => sum + item.amount,
        0
      ),
      publishedOrdersThisMonth: data.orders.filter(
        (item) =>
          publishedStatuses.has(item.status) &&
          isSameBeijingMonth(item.publishDate, now)
      ).length,
      comparison: null,
    },
    actions,
    recentClients: [...data.clients]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .slice(0, 5),
    recentOrders: [...data.orders]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .slice(0, 5),
    upcomingSocialPlans: [...data.socialPlans]
      .filter((item) => item.status === 'planned')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5),
  }
}
