import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import {
  eventStatusLabels,
  eventTypeLabels,
  venueTypeLabels,
} from '../constants'
import {
  eventData,
  useDeleteEvent,
  useDeleteVenue,
  useEvents,
  useSaveEvent,
  useSaveVenue,
  useVenues,
  venueData,
} from '../hooks/use-market-records'
import type { EventInput, VenueInput } from '../types'

export function EventsPanel({ query }: { query: string }) {
  const events = useEvents(query)
  const save = useSaveEvent()
  const remove = useDeleteEvent()
  const [draft, setDraft] = useState<EventInput>({
    name: '',
    type: 'closed_salon',
    theme: '',
    startDate: '',
    locationCity: '',
    targetAttendees: 0,
    targetSponsorship: 0,
    totalBudget: 0,
    status: 'preparing',
  })
  return (
    <div className='space-y-4'>
      <div className='grid gap-2 rounded-lg border p-4 sm:grid-cols-4'>
        <Input
          placeholder='活动名称'
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <Input
          type='date'
          value={draft.startDate}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
        />
        <Input
          placeholder='城市'
          value={draft.locationCity}
          onChange={(e) => setDraft({ ...draft, locationCity: e.target.value })}
        />
        <Button
          disabled={!draft.name || !draft.startDate || save.isPending}
          onClick={() =>
            void save
              .mutateAsync({ data: eventData(draft) })
              .then(() => setDraft({ ...draft, name: '' }))
          }
        >
          <Plus className='size-4' />
          新建活动
        </Button>
      </div>
      {events.data?.length ? (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>活动</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>状态</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.data.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className='font-medium'>
                    <Link
                      className='hover:text-primary hover:underline'
                      to='/market/events/$eventId'
                      params={{ eventId: event.id }}
                    >
                      {event.name}
                    </Link>
                    <div className='text-xs text-muted-foreground'>
                      {event.theme}
                    </div>
                  </TableCell>
                  <TableCell>{eventTypeLabels[event.type]}</TableCell>
                  <TableCell>{event.startDate}</TableCell>
                  <TableCell>{event.locationCity}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>
                      {eventStatusLabels[event.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label='删除活动'
                      onClick={() => void remove.mutateAsync(event.id)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title='暂无活动'
          description='创建第一场金鳞会活动，后续可继续配置阶段和任务。'
        />
      )}
    </div>
  )
}

export function VenuesPanel({ query }: { query: string }) {
  const venues = useVenues(query)
  const save = useSaveVenue()
  const remove = useDeleteVenue()
  const [draft, setDraft] = useState<VenueInput>({
    name: '',
    type: 'hotel',
    city: '',
    address: '',
    capacityMin: 0,
    capacityMax: 0,
    priceRange: '',
    sceneTags: '',
    pros: '',
    cons: '',
    contactName: '',
    contactPhone: '',
    siteVisitDate: '',
    siteVisitNotes: '',
    isVerified: false,
    usageCount: 0,
  })
  return (
    <div className='space-y-4'>
      <div className='grid gap-2 rounded-lg border p-4 sm:grid-cols-4'>
        <Input
          placeholder='场地名称'
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <Input
          placeholder='城市'
          value={draft.city}
          onChange={(e) => setDraft({ ...draft, city: e.target.value })}
        />
        <Input
          placeholder='容量上限'
          type='number'
          value={draft.capacityMax}
          onChange={(e) =>
            setDraft({ ...draft, capacityMax: Number(e.target.value) })
          }
        />
        <Button
          disabled={!draft.name || !draft.city || save.isPending}
          onClick={() =>
            void save
              .mutateAsync({ data: venueData(draft) })
              .then(() => setDraft({ ...draft, name: '' }))
          }
        >
          <Plus className='size-4' />
          新建场地
        </Button>
      </div>
      {venues.data?.length ? (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>场地</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>容纳人数</TableHead>
                <TableHead>验证</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.data.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className='font-medium'>
                    {venue.name}
                    <div className='text-xs text-muted-foreground'>
                      {venue.sceneTags}
                    </div>
                  </TableCell>
                  <TableCell>{venueTypeLabels[venue.type]}</TableCell>
                  <TableCell>{venue.city}</TableCell>
                  <TableCell>
                    {venue.capacityMin || 0} - {venue.capacityMax || '不限'}
                  </TableCell>
                  <TableCell>
                    {venue.isVerified ? (
                      <Badge>已验证</Badge>
                    ) : (
                      <Badge variant='outline'>待验证</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label='删除场地'
                      onClick={() => void remove.mutateAsync(venue.id)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title='暂无场地资源'
          description='录入可用于闭门沙龙、峰会和游学的高端场地。'
        />
      )}
    </div>
  )
}
