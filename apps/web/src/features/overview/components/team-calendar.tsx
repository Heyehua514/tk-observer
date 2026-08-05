/**
 * 团队日历月视图占位页。
 * 路由：/overview/calendar；权限：boss。
 */
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { calendarWeekdays } from '../constants'
import { useCalendarPlaceholder } from '../hooks/use-calendar-placeholder'

export function TeamCalendar() {
  const calendar = useCalendarPlaceholder()
  return (
    <div className='space-y-6'>
      <PageHeader
        title='团队日历'
        description='统一查看活动、设计审核、视频交付和发布排期。'
      />
      <section className='overflow-hidden rounded-lg border'>
        <header className='flex h-14 items-center gap-2 border-b px-4'>
          <CalendarDays className='size-4' />
          <h2 className='text-sm font-medium'>
            {calendar.year} 年 {calendar.month} 月
          </h2>
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
          {calendar.days.map((item) => (
            <div
              key={item.key}
              className='min-h-24 border-r border-b p-2 last:border-r-0'
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
            </div>
          ))}
        </div>
      </section>
      <EmptyState
        title='暂无团队排期'
        description='下一轮将把活动、设计审核、视频截止日和发布时间接入此日历。'
      />
    </div>
  )
}
