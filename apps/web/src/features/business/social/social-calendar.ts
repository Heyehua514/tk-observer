/** 商务工作台朋友圈周视图模型；只聚合当前周发布计划。 */
export type SocialCalendarPlan = {
  id: string
  date: string
  content: string
  status: string
}

export type SocialWeekDay = {
  key: string
  label: string
  day: number
  plans: SocialCalendarPlan[]
}

const weekdays = ['一', '二', '三', '四', '五', '六', '日'] as const

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

const parseDate = (value: string) => {
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildSocialWeek(
  current: Date,
  plans: SocialCalendarPlan[]
): SocialWeekDay[] {
  const start = new Date(current)
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)

  const grouped = new Map<string, SocialCalendarPlan[]>()
  for (const plan of plans) {
    const date = parseDate(plan.date)
    if (!date) continue
    const key = keyOf(date)
    grouped.set(key, [...(grouped.get(key) || []), plan])
  }

  return weekdays.map((label, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = keyOf(date)
    return {
      key,
      label,
      day: date.getDate(),
      plans: grouped.get(key) || [],
    }
  })
}
