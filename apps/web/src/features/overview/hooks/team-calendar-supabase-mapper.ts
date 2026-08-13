/** 团队日历 Supabase 映射层；权限：boss 总览只读。 */
import type { TeamCalendarItem } from '../team-calendar-model'

type Row = Record<string, unknown>

export function mapSupabaseCalendarEvent(record: Row): TeamCalendarItem {
  return {
    id: String(record.id || ''),
    title: String(record.name || '活动'),
    date: String(record.start_date || ''),
    type: 'activity',
  }
}

export function mapSupabaseCalendarEventTask(record: Row): TeamCalendarItem {
  return {
    id: String(record.id || ''),
    title: String(record.title || '活动任务'),
    date: String(record.due_date || ''),
    type: 'task',
  }
}

export function mapSupabaseCalendarDesignRequirement(
  record: Row
): TeamCalendarItem {
  return {
    id: String(record.id || ''),
    title: String(record.title || '设计需求'),
    date: String(record.due_date || ''),
    type: 'design',
  }
}

export function mapSupabaseCalendarSocialPlan(record: Row): TeamCalendarItem {
  return {
    id: String(record.id || ''),
    title: String(record.content || '朋友圈计划').slice(0, 24),
    date: String(record.date || ''),
    type: 'social',
  }
}

export function mapSupabaseCalendarChannelOrder(
  record: Row
): TeamCalendarItem {
  return {
    id: String(record.id || ''),
    title: String(record.title || '渠道商单'),
    date: String(record.publish_date || ''),
    type: 'order',
  }
}
