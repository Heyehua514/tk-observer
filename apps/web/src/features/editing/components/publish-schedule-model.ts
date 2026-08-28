export function combineLocalDateTime(date: string, time: string) {
  return date ? `${date.slice(0, 10)}T${time || '09:00'}` : ''
}
