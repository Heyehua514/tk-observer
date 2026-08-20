import { describe, expect, it } from 'vitest'
import {
  buildCalendarMonth,
  formatCalendarDualTime,
  resolveCityTimeZone,
} from './team-calendar-model'

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

describe('formatCalendarDualTime', () => {
  it('shows Beijing and local time for an overseas activity', () => {
    expect(
      formatCalendarDualTime('2026-08-12T01:00:00.000Z', '东京')
    ).toContain('北京时间')
    expect(
      formatCalendarDualTime('2026-08-12T01:00:00.000Z', '东京')
    ).toContain('东京')
  })

  it('does not invent a clock time for date-only activities', () => {
    expect(formatCalendarDualTime('2026-08-12', '厦门')).toBe('8月12日 · 厦门')
  })

  it('falls back to Beijing for unknown cities', () => {
    expect(resolveCityTimeZone('未知城市')).toBe('Asia/Shanghai')
  })
})
