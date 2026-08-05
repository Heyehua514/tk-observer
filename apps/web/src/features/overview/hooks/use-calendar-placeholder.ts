/** 生成当月团队日历的固定 6x7 占位网格。 */
import { useMemo } from 'react'
import type { CalendarPlaceholderDay } from '../types'

export function useCalendarPlaceholder(date = new Date()) {
  return useMemo(() => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const offset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    const days: CalendarPlaceholderDay[] = Array.from(
      { length: 42 },
      (_, index) => {
        const day = index - offset + 1
        const inMonth = day >= 1 && day <= daysInMonth
        return {
          key: `${year}-${month}-${index}`,
          day: inMonth ? day : null,
          isToday:
            inMonth &&
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate(),
        }
      }
    )
    return { year, month: month + 1, days }
  }, [date])
}
