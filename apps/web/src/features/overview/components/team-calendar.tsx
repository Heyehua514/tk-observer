/**
 * 团队日历月视图。
 * 路由：/overview/calendar；权限：boss。
 */
import { CalendarDays, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { calendarWeekdays } from '../constants'
import { useTeamCalendar } from '../hooks/use-team-calendar'
import type { TeamCalendarItemType } from '../team-calendar-model'

const typeLabel: Record<TeamCalendarItemType, string> = {
  activity: '活动',
  task: '任务',
  design: '设计',
  social: '朋友圈',
  order: '商单',
}

const typeClass: Record<TeamCalendarItemType, string> = {
  activity: 'border-blue-200 bg-blue-50 text-blue-700',
  task: 'border-slate-200 bg-slate-50 text-slate-700',
  design: 'border-amber-200 bg-amber-50 text-amber-700',
  social: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  order: 'border-violet-200 bg-violet-50 text-violet-700',
}

export function TeamCalendar() {
  const calendar = useTeamCalendar()
  const totalItems =
    calendar.data?.days.reduce((sum, day) => sum + day.items.length, 0) ?? 0
  return (
    <div className='space-y-6'>
      <PageHeader
        title='团队日历'
        description='统一查看活动、设计审核、视频交付和发布排期。'
      />
      <section className='overflow-hidden rounded-lg border'>
        <header className='flex h-14 items-center justify-between border-b px-4'>
          <h2 className='flex items-center gap-2 text-sm font-medium'>
            <CalendarDays className='size-4' />
            {calendar.data?.year ?? new Date().getFullYear()} 年{' '}
            {calendar.data?.month ?? new Date().getMonth() + 1} 月
          </h2>
          {calendar.isLoading ? (
            <LoaderCircle className='size-4 animate-spin text-muted-foreground' />
          ) : (
            <span className='text-xs text-muted-foreground'>
              {totalItems} 个排期事项
            </span>
          )}
        </header>
        <div className='grid grid-cols-7 border-b bg-muted/30'>
          {calendarWeekdays.map((weekday) => (
            <div
              key={weekday}
              className='px-2 py-2 text-center text-xs text-muted-foreground'
            >
              周{weekday}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {(calendar.data?.days || []).map((item) => (
            <div
              key={item.key}
              className='min-h-28 space-y-1 border-r border-b p-2 last:border-r-0'
            >
              {item.day && (
                <span
                  className={cn(
                    'flex size-7 items-center justify-center text-xs',
                    item.isToday && 'rounded-full bg-blue-600 text-white'
                  )}
                >
                  {item.day}
                </span>
              )}
              {item.items.slice(0, 3).map((calendarItem) => (
                <div
                  key={`${calendarItem.type}-${calendarItem.id}`}
                  className={cn(
                    'truncate rounded border px-1.5 py-1 text-[11px] leading-none',
                    typeClass[calendarItem.type]
                  )}
                  title={`${typeLabel[calendarItem.type]}：${calendarItem.title}`}
                >
                  {typeLabel[calendarItem.type]} · {calendarItem.title}
                </div>
              ))}
              {item.items.length > 3 && (
                <div className='text-[11px] text-muted-foreground'>
                  +{item.items.length - 3} 更多
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {!calendar.isLoading && totalItems === 0 && (
        <EmptyState
          title='还没有团队排期'
          description='活动、任务、设计需求、朋友圈计划和商单发布日期会自动汇总到这里。'
        />
      )}
    </div>
  )
}
