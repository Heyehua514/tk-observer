/** 总览近期活动：复用市场 events 查询并跳转到活动详情。 */
import { CalendarDays, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { eventStatusLabels, eventTypeLabels } from '@/features/market/constants'
import type { Event } from '@/features/market/types'
import { selectUpcomingActivities } from './upcoming-activities-model'

export function UpcomingActivities({ events }: { events: Event[] }) {
  const upcoming = selectUpcomingActivities(events)

  return (
    <Card className='bento-card shadow-none'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <CalendarDays className='size-4' />
          近期活动
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length ? (
          <div className='space-y-3'>
            {upcoming.map((event) => (
              <UpcomingActivityItem event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title='还没有即将开始的活动'
            description='市场工作台创建并定档后，近期活动会自动显示在这里。'
          />
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingActivityItem({ event }: { event: Event }) {
  return (
    <a
      className='block rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-muted/30'
      href={`/market/events/${event.id}`}
    >
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='font-medium'>{event.name}</div>
        <Badge variant='secondary'>{eventStatusLabels[event.status]}</Badge>
      </div>
      <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
        <span>{event.startDate.slice(0, 10)}</span>
        <span className='inline-flex items-center gap-1'>
          <MapPin className='size-3' />
          {event.locationCity || '地点待定'}
        </span>
        <span>{eventTypeLabels[event.type]}</span>
      </div>
    </a>
  )
}
