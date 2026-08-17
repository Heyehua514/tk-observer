/** 总览近期活动：按北京日历筛选未来最近活动。 */
function beijingDateKey(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function selectUpcomingActivities<T extends { startDate: string }>(
  events: readonly T[],
  now = new Date(),
  limit = 3
): T[] {
  const today = beijingDateKey(now)
  return events
    .filter((event) => event.startDate.slice(0, 10) >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .slice(0, limit)
}
