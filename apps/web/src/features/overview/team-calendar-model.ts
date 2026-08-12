/** 总览工作台团队日历模型：把跨工作台日期事项归入月视图。 */
export type TeamCalendarItemType =
  'activity' | 'task' | 'design' | 'social' | 'order'

export type TeamCalendarItem = {
  id: string
  title: string
  date: string
  type: TeamCalendarItemType
}

export type TeamCalendarDay = {
  key: string
  day: number | null
  isToday: boolean
  items: TeamCalendarItem[]
}

export type TeamCalendarMonth = {
  year: number
  month: number
  days: TeamCalendarDay[]
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

const toDate = (value: string) => {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildCalendarMonth(
  date = new Date(),
  items: TeamCalendarItem[] = []
): TeamCalendarMonth {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const offset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dayKey(date)
  const grouped = new Map<string, TeamCalendarItem[]>()

  for (const item of items) {
    const itemDate = toDate(item.date)
    if (
      !itemDate ||
      itemDate.getFullYear() !== year ||
      itemDate.getMonth() !== month
    ) {
      continue
    }
    const key = dayKey(itemDate)
    grouped.set(key, [...(grouped.get(key) || []), item])
  }

  return {
    year,
    month: month + 1,
    days: Array.from({ length: 42 }, (_, index) => {
      const day = index - offset + 1
      const inMonth = day >= 1 && day <= daysInMonth
      const key = inMonth
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : `${year}-${month}-${index}`
      return {
        key,
        day: inMonth ? day : null,
        isToday: inMonth && key === todayKey,
        items: inMonth ? grouped.get(key) || [] : [],
      }
    }),
  }
}
