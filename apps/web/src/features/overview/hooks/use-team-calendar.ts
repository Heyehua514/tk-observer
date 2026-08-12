/** 总览工作台团队日历只读数据 Hook，汇总活动、任务、设计、朋友圈和商单日期。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import {
  buildCalendarMonth,
  type TeamCalendarItem,
} from '../team-calendar-model'

const dateOnly = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export function useTeamCalendar(date = new Date()) {
  const monthKey = dateOnly(date)
  return useQuery({
    queryKey: ['overview', 'team-calendar', monthKey, date.toISOString()],
    queryFn: async () => {
      const [
        events,
        eventTasks,
        designRequirements,
        socialPlans,
        channelOrders,
      ] = await Promise.allSettled([
        pb.collection('events').getFullList({ sort: 'start_date' }),
        pb.collection('event_tasks').getFullList({ sort: 'due_date' }),
        pb.collection('design_requirements').getFullList({ sort: 'due_date' }),
        pb.collection('social_plans').getFullList({ sort: 'date' }),
        pb.collection('channel_orders').getFullList({ sort: 'publish_date' }),
      ])

      const items: TeamCalendarItem[] = []
      if (events.status === 'fulfilled') {
        items.push(
          ...events.value.map((record) => ({
            id: record.id,
            title: String(record.name || '活动'),
            date: String(record.start_date || ''),
            type: 'activity' as const,
          }))
        )
      }
      if (eventTasks.status === 'fulfilled') {
        items.push(
          ...eventTasks.value.map((record) => ({
            id: record.id,
            title: String(record.title || '活动任务'),
            date: String(record.due_date || ''),
            type: 'task' as const,
          }))
        )
      }
      if (designRequirements.status === 'fulfilled') {
        items.push(
          ...designRequirements.value.map((record) => ({
            id: record.id,
            title: String(record.title || '设计需求'),
            date: String(record.due_date || ''),
            type: 'design' as const,
          }))
        )
      }
      if (socialPlans.status === 'fulfilled') {
        items.push(
          ...socialPlans.value.map((record) => ({
            id: record.id,
            title: String(record.content || '朋友圈计划').slice(0, 24),
            date: String(record.date || ''),
            type: 'social' as const,
          }))
        )
      }
      if (channelOrders.status === 'fulfilled') {
        items.push(
          ...channelOrders.value.map((record) => ({
            id: record.id,
            title: String(record.title || '渠道商单'),
            date: String(record.publish_date || ''),
            type: 'order' as const,
          }))
        )
      }

      return buildCalendarMonth(
        date,
        items.filter((item) => item.date)
      )
    },
  })
}
