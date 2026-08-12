import { describe, expect, it } from 'vitest'
import { buildSocialWeek } from './social-calendar'

describe('buildSocialWeek', () => {
  it('groups plans into the Monday based current week', () => {
    const week = buildSocialWeek(new Date('2026-08-12T10:00:00+08:00'), [
      {
        id: 'p1',
        date: '2026-08-10 00:00:00.000Z',
        content: '周一内容',
        status: 'planned',
      },
      {
        id: 'p2',
        date: '2026-08-12 00:00:00.000Z',
        content: '周三内容',
        status: 'published',
      },
    ])

    expect(week.map((day) => day.label)).toEqual([
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '日',
    ])
    expect(week[0].plans.map((plan) => plan.content)).toEqual(['周一内容'])
    expect(week[2].plans.map((plan) => plan.content)).toEqual(['周三内容'])
  })
})
