export function getGreetingForBeijingHour(hour: number) {
  if (hour >= 5 && hour < 11) return '早上好，打工人'
  if (hour >= 11 && hour < 17) return '中午好，打工人'
  return '晚上好，打工人'
}

export function getBeijingHour(date: Date) {
  const hour = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value
  return Number(hour || 0) % 24
}
