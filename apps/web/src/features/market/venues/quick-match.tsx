/** 市场工作台场地快速匹配面板。权限：market、boss。 */
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  venueTypeLabels,
  venueTypes,
  type VenueFilters,
  type VenueType,
} from './types'

export function QuickMatch({
  cities,
  filters,
  onChange,
  onClose,
}: {
  cities: string[]
  filters: VenueFilters
  onChange: (v: VenueFilters) => void
  onClose: () => void
}) {
  const set = <K extends keyof VenueFilters>(key: K, value: VenueFilters[K]) =>
    onChange({ ...filters, [key]: value })
  return (
    <div className='grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-4'>
      <div className='sm:col-span-4'>
        <h3 className='flex items-center gap-2 font-medium'>
          <Search className='size-4' />
          快速匹配活动需求
        </h3>
      </div>
      <div className='grid gap-2'>
        <Label>城市</Label>
        <Select
          value={filters.city || 'all'}
          onValueChange={(v) => set('city', v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部城市</SelectItem>
            {cities.map((c) => (
              <SelectItem value={c} key={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='grid gap-2'>
        <Label>活动人数</Label>
        <Input
          min={0}
          type='number'
          value={filters.attendees || ''}
          onChange={(e) => set('attendees', Number(e.target.value))}
        />
      </div>
      <div className='grid gap-2'>
        <Label>场地类型</Label>
        <Select
          value={filters.type}
          onValueChange={(v) => set('type', v as VenueType | 'all')}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部类型</SelectItem>
            {venueTypes.map((v) => (
              <SelectItem value={v} key={v}>
                {venueTypeLabels[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-end'>
        <Button className='w-full' variant='outline' onClick={onClose}>
          收起匹配
        </Button>
      </div>
    </div>
  )
}
