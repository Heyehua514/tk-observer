import { describe, expect, it } from 'vitest'
import { buildCalendarMonth } from './team-calendar-model'

describe('buildCalendarMonth', () => {
  it('places events on their Beijing calendar day and keeps empty cells stable', () => {
    const calendar = buildCalendarMonth(new Date('2026-08-12T01:00:00+08:00'), [
      {
        id: 'event-1',
        title: '厦门闭门沙龙',
        date: '2026-08-12 00:00:00.000Z',
        type: 'activity',
      },
      {
        id: 'task-1',
        title: '设计稿截止',
        date: '2026-08-12T12:00:00.000Z',
        type: 'task',
      },
    ])

    const day12 = calendar.days.find((day) => day.day === 12)

    expect(calendar.year).toBe(2026)
    expect(calendar.month).toBe(8)
    expect(calendar.days).toHaveLength(42)
    expect(calendar.days[0].day).toBe(null)
    expect(day12?.isToday).toBe(true)
    expect(day12?.items.map((item) => item.title)).toEqual([
      '厦门闭门沙龙',
      '设计稿截止',
    ])
  })
})
