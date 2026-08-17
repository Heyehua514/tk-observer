/** 市场工作台场地资源库入口。权限：market、boss。 */
import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { matchVenues } from './match-venues'
import { QuickMatch } from './quick-match'
import {
  venueTypeLabels,
  venueTypes,
  type Venue,
  type VenueFilters,
  type VenueType,
} from './types'
import { useSoftDeleteVenue, useVenueResources } from './use-venues'
import { VenueDetail } from './venue-detail'
import { VenueForm } from './venue-form'

const initial: VenueFilters = { query: '', city: '', type: 'all', attendees: 0 }
export function VenuesWorkbench() {
  const venues = useVenueResources()
  const remove = useSoftDeleteVenue()
  const [filters, setFilters] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [matching, setMatching] = useState(false)
  const [selected, setSelected] = useState<Venue | null>(null)
  const [editing, setEditing] = useState<Venue | null>(null)
  const cities = useMemo(
    () => [...new Set(venues.data?.map((v) => v.city) ?? [])].sort(),
    [venues.data]
  )
  const visible = useMemo(
    () => matchVenues(venues.data ?? [], filters),
    [venues.data, filters]
  )
  function edit(venue: Venue) {
    setSelected(null)
    setEditing(venue)
    setFormOpen(true)
  }
  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold'>高端场地资源库</h2>
          <p className='text-sm text-muted-foreground'>
            已收录 {venues.data?.length ?? 0} 个场地，
            {venues.data?.filter((v) => v.isVerified).length ?? 0} 个已验证。
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setMatching(!matching)}>
            <Search />
            快速匹配
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            新增场地
          </Button>
        </div>
      </div>
      {matching && (
        <QuickMatch
          cities={cities}
          filters={filters}
          onChange={setFilters}
          onClose={() => setMatching(false)}
        />
      )}
      <div className='grid gap-3 md:grid-cols-[1fr_180px_180px]'>
        <Input
          placeholder='搜索场地名称或标签'
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <Select
          value={filters.city || 'all'}
          onValueChange={(v) =>
            setFilters({ ...filters, city: v === 'all' ? '' : v })
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='城市' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部城市</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(v) =>
            setFilters({ ...filters, type: v as VenueType | 'all' })
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部类型</SelectItem>
            {venueTypes.map((v) => (
              <SelectItem key={v} value={v}>
                {venueTypeLabels[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {venues.isLoading ? (
        <p className='py-12 text-center text-muted-foreground'>
          正在加载场地...
        </p>
      ) : visible.length ? (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {visible.map((venue) => (
            <Card
              className='group relative cursor-pointer overflow-hidden py-0'
              key={venue.id}
              onClick={() => setSelected(venue)}
            >
              <button
                type='button'
                aria-label='删除场地'
                className='absolute top-2 right-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus:opacity-100'
                onClick={(e) => {
                  e.stopPropagation()
                  void remove.mutateAsync(venue.id)
                }}
              >
                <Trash2 className='size-4' />
              </button>
              {venue.photos[0] ? (
                <img
                  className='aspect-[16/9] w-full object-cover'
                  src={venue.photos[0]}
                  alt={venue.name}
                />
              ) : (
                <div className='flex aspect-[16/9] items-center justify-center bg-muted'>
                  <Building2 className='size-10 text-muted-foreground' />
                </div>
              )}
              <CardHeader className='px-4'>
                <CardTitle className='flex items-start justify-between gap-2 text-base'>
                  <span>{venue.name}</span>
                  {venue.isVerified && (
                    <CheckCircle2 className='size-5 shrink-0 text-emerald-600' />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 px-4 pb-4'>
                <div className='flex gap-4 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <MapPin className='size-4' />
                    {venue.city}
                  </span>
                  <span className='flex items-center gap-1'>
                    <Users className='size-4' />
                    {venue.capacityMin}-{venue.capacityMax}
                  </span>
                </div>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='outline'>{venueTypeLabels[venue.type]}</Badge>
                  {venue.sceneTags
                    .split(/[,，]/)
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((tag) => (
                      <Badge variant='secondary' key={tag}>
                        {tag.trim()}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='rounded-md border border-dashed py-16 text-center text-muted-foreground'>
          <Building2 className='mx-auto mb-3 size-10' />
          <p>没有符合条件的场地</p>
          <Button
            className='mt-4'
            variant='outline'
            onClick={() => setFilters(initial)}
          >
            清除筛选
          </Button>
        </div>
      )}
      <VenueForm open={formOpen} onOpenChange={setFormOpen} venue={editing} />
      <VenueDetail
        venue={selected}
        onClose={() => setSelected(null)}
        onEdit={edit}
      />
    </div>
  )
}
