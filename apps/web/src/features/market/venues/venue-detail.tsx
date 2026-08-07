/** 市场工作台场地详情。权限：market、boss；活动历史只读。 */
import { useState } from 'react'
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { venueTypeLabels, type Venue } from './types'
import { useVenueEvents } from './use-venues'

export function VenueDetail({
  venue,
  onClose,
  onEdit,
}: {
  venue: Venue | null
  onClose: () => void
  onEdit: (v: Venue) => void
}) {
  const [photo, setPhoto] = useState(0)
  const events = useVenueEvents(venue?.id)
  if (!venue) return null
  const move = (delta: number) =>
    setPhoto((photo + delta + venue.photos.length) % venue.photos.length)
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {venue.name}
            {venue.isVerified && <Badge>已验证</Badge>}
          </DialogTitle>
          <DialogDescription>
            {venueTypeLabels[venue.type]} · 已使用 {venue.usageCount} 次
          </DialogDescription>
        </DialogHeader>
        {venue.photos.length ? (
          <div className='relative aspect-video overflow-hidden rounded-md bg-muted'>
            <img
              className='size-full object-cover'
              src={venue.photos[photo]}
              alt={`${venue.name} 场地照片 ${photo + 1}`}
            />
            {venue.photos.length > 1 && (
              <>
                <Button
                  aria-label='上一张'
                  className='absolute top-1/2 left-3'
                  size='icon'
                  variant='secondary'
                  onClick={() => move(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  aria-label='下一张'
                  className='absolute top-1/2 right-3'
                  size='icon'
                  variant='secondary'
                  onClick={() => move(1)}
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className='flex aspect-video items-center justify-center rounded-md bg-muted text-muted-foreground'>
            <Building2 className='mr-2' />
            暂无照片
          </div>
        )}
        <div className='grid gap-3 text-sm sm:grid-cols-2'>
          <Info
            icon={<MapPin />}
            label='地址'
            value={`${venue.city} ${venue.address}`}
          />
          <Info
            icon={<Users />}
            label='容纳人数'
            value={`${venue.capacityMin}-${venue.capacityMax} 人`}
          />
          <Info
            icon={<Phone />}
            label='对接人'
            value={`${venue.contactName || '-'} ${venue.contactPhone}`}
          />
          <Info
            icon={<CalendarDays />}
            label='最近踩点'
            value={venue.siteVisitDate?.slice(0, 10) || '-'}
          />
        </div>
        <section className='grid gap-2'>
          <h3 className='font-medium'>标签</h3>
          <div className='flex flex-wrap gap-2'>
            {venue.sceneTags
              .split(/[,，]/)
              .filter(Boolean)
              .map((tag) => (
                <Badge key={tag} variant='secondary'>
                  {tag.trim()}
                </Badge>
              ))}
          </div>
        </section>
        <div className='grid gap-4 sm:grid-cols-2'>
          <TextBlock title='场地优势' text={venue.pros} />
          <TextBlock title='场地不足' text={venue.cons} />
        </div>
        <TextBlock title='踩点记录' text={venue.siteVisitNotes} />
        <section>
          <h3 className='mb-2 font-medium'>历史使用记录</h3>
          {events.data?.length ? (
            <div className='divide-y rounded-md border'>
              {events.data.map((event) => (
                <div
                  className='flex justify-between p-3 text-sm'
                  key={event.id}
                >
                  <span>{String(event.name)}</span>
                  <span className='text-muted-foreground'>
                    {String(event.start_date).slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className='rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground'>
              该场地暂无关联活动
            </p>
          )}
        </section>
        <div className='flex justify-end'>
          <Button onClick={() => onEdit(venue)}>编辑场地</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='flex items-center gap-2 rounded-md border p-3 [&_svg]:size-4 [&_svg]:text-muted-foreground'>
      <span>{icon}</span>
      <div>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p>{value}</p>
      </div>
    </div>
  )
}
function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h3 className='mb-1 font-medium'>{title}</h3>
      <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
        {text || '暂无记录'}
      </p>
    </section>
  )
}
