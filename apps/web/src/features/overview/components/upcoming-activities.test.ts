/** 总览近期活动筛选规则测试。 */
import { expect, it } from 'vitest'
import { selectUpcomingActivities } from './upcoming-activities-model'

it('按日期返回未来最近三场活动', () => {
  const result = selectUpcomingActivities(
    [
      { id: 'past', startDate: '2026-08-16' },
      { id: 'third', startDate: '2026-08-22' },
      { id: 'first', startDate: '2026-08-18' },
      { id: 'fourth', startDate: '2026-08-25' },
      { id: 'second', startDate: '2026-08-20' },
    ],
    new Date('2026-08-17T12:00:00+08:00')
  )

  expect(result.map((item) => item.id)).toEqual(['first', 'second', 'third'])
})
