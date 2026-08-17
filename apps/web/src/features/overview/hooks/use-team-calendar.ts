/** 总览工作台团队日历只读数据 Hook，汇总活动、任务、设计、朋友圈和商单日期。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  buildCalendarMonth,
  type TeamCalendarItem,
} from '../team-calendar-model'
import {
  mapSupabaseCalendarChannelOrder,
  mapSupabaseCalendarDesignRequirement,
  mapSupabaseCalendarEvent,
  mapSupabaseCalendarEventTask,
  mapSupabaseCalendarSocialPlan,
} from './team-calendar-supabase-mapper'

export function useTeamCalendar(date = new Date()) {
  return useQuery({
    // key 只用稳定的 YYYY-MM：顶部时钟等高频重渲染若把毫秒时间戳放进 key，
    // React Query 每次渲染都会作废旧请求并无限重发（已在 E2E 实测复现）。
    queryKey: [
      'overview',
      'team-calendar',
      date.getFullYear(),
      date.getMonth(),
    ],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const [
          events,
          eventTasks,
          designRequirements,
          socialPlans,
          channelOrders,
        ] = await Promise.allSettled([
          getSupabaseClient()
            .from('events')
            .select('id,name,start_date')
            .is('deleted_at', null)
            .order('start_date'),
          getSupabaseClient()
            .from('event_tasks')
            .select('id,title,due_date')
            .is('deleted_at', null)
            .order('due_date'),
          getSupabaseClient()
            .from('design_requirements')
            .select('id,title,due_date')
            .is('deleted_at', null)
            .order('due_date'),
          getSupabaseClient()
            .from('social_plans')
            .select('id,content,date')
            .is('deleted_at', null)
            .order('date'),
          getSupabaseClient()
            .from('channel_orders')
            .select('id,title,publish_date')
            .is('deleted_at', null)
            .order('publish_date'),
        ])

        const items: TeamCalendarItem[] = []
        if (events.status === 'fulfilled' && !events.value.error) {
          items.push(...(events.value.data || []).map(mapSupabaseCalendarEvent))
        }
        if (eventTasks.status === 'fulfilled' && !eventTasks.value.error) {
          items.push(
            ...(eventTasks.value.data || []).map(mapSupabaseCalendarEventTask)
          )
        }
        if (
          designRequirements.status === 'fulfilled' &&
          !designRequirements.value.error
        ) {
          items.push(
            ...(designRequirements.value.data || []).map(
              mapSupabaseCalendarDesignRequirement
            )
          )
        }
        if (socialPlans.status === 'fulfilled' && !socialPlans.value.error) {
          items.push(
            ...(socialPlans.value.data || []).map(mapSupabaseCalendarSocialPlan)
          )
        }
        if (
          channelOrders.status === 'fulfilled' &&
          !channelOrders.value.error
        ) {
          items.push(
            ...(channelOrders.value.data || []).map(
              mapSupabaseCalendarChannelOrder
            )
          )
        }
        return buildCalendarMonth(
          date,
          items.filter((item) => item.date)
        )
      }
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
