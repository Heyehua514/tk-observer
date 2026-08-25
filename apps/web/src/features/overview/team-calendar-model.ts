/** 总览工作台团队日历模型：把跨工作台日期事项归入月视图。 */
export type TeamCalendarItemType =
  'activity' | 'task' | 'design' | 'social' | 'order'

export type TeamCalendarItem = {
  id: string
  title: string
  date: string
  type: TeamCalendarItemType
  locationCity?: string
  locationTimeZone?: string
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

const cityTimeZones: Record<string, string> = {
  北京: 'Asia/Shanghai',
  上海: 'Asia/Shanghai',
  厦门: 'Asia/Shanghai',
  深圳: 'Asia/Shanghai',
  广州: 'Asia/Shanghai',
  杭州: 'Asia/Shanghai',
  新加坡: 'Asia/Singapore',
  东京: 'Asia/Tokyo',
  首尔: 'Asia/Seoul',
  纽约: 'America/New_York',
  洛杉矶: 'America/Los_Angeles',
  伦敦: 'Europe/London',
}

export function resolveCityTimeZone(city?: string): string {
  if (!city) return 'Asia/Shanghai'
  return cityTimeZones[city.trim()] || 'Asia/Shanghai'
}

export function formatCalendarDualTime(
  value: string,
  city?: string,
  timeZone?: string
): string {
  const parsed = toDate(value)
  if (!parsed)
    return city ? `${value.slice(0, 10)} · ${city}` : value.slice(0, 10)
  const hasTime = /T|\d{2}:\d{2}/.test(value)
  const dateParts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(parsed)
  const beijingDate = `${dateParts.find((part) => part.type === 'month')?.value}月${dateParts.find((part) => part.type === 'day')?.value}日`
  const beijingTime = hasTime
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(parsed)
    : ''
  const beijing = hasTime ? `${beijingDate} ${beijingTime}` : beijingDate
  if (!city || !hasTime) return city ? `${beijing} · ${city}` : beijing
  const zone = timeZone || resolveCityTimeZone(city)
  if (zone === 'Asia/Shanghai') return `${beijing} · ${city}`
  const local = new Intl.DateTimeFormat('zh-CN', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
  return `北京时间 ${beijing} · ${city} ${local}`
}

const beijingFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

const getBeijingParts = (date: Date) => {
  const parts = beijingFormatter.formatToParts(date)
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
    weekday: parts.find((part) => part.type === 'weekday')?.value,
  }
}

const dayKey = (date: Date) => {
  const parts = getBeijingParts(date)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}`
}

const toDate = (value: string) => {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildCalendarMonth(
  date = new Date(),
  items: TeamCalendarItem[] = []
): TeamCalendarMonth {
  const dateParts = getBeijingParts(date)
  const year = dateParts.year
  const month = dateParts.month - 1
  const firstDay = new Date(Date.UTC(year, month, 1))
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    getBeijingParts(firstDay).weekday || ''
  )
  const offset = (weekdayIndex + 6) % 7
  const daysInMonth = getBeijingParts(new Date(Date.UTC(year, month + 1, 0))).day
  const todayKey = dayKey(date)
  const grouped = new Map<string, TeamCalendarItem[]>()

  for (const item of items) {
    const itemDate = toDate(item.date)
    if (
      !itemDate ||
      getBeijingParts(itemDate).year !== year ||
      getBeijingParts(itemDate).month - 1 !== month
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
