/** 市场工作台场地新增/编辑表单。权限：market、boss。 */
import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  venueTypeLabels,
  venueTypes,
  type Venue,
  type VenueInput,
  type VenueType,
} from './types'
import { useSaveVenueResource } from './use-venues'

const blank: VenueInput = {
  name: '',
  type: 'hotel',
  city: '',
  address: '',
  capacityMin: 1,
  capacityMax: 50,
  priceRange: '',
  sceneTags: '',
  pros: '',
  cons: '',
  contactName: '',
  contactPhone: '',
  siteVisitDate: '',
  siteVisitNotes: '',
  isVerified: false,
}
export function VenueForm({
  open,
  onOpenChange,
  venue,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  venue: Venue | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <VenueFormContent
          key={venue?.id ?? 'new'}
          venue={venue}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function VenueFormContent({
  venue,
  onOpenChange,
}: {
  venue: Venue | null
  onOpenChange: (v: boolean) => void
}) {
  const [input, setInput] = useState<VenueInput>(() =>
    venue ? { ...venue, type: venue.type } : blank
  )
  const [files, setFiles] = useState<File[]>([])
  const save = useSaveVenueResource()
  const set = <K extends keyof VenueInput>(key: K, value: VenueInput[K]) =>
    setInput((old) => ({ ...old, [key]: value }))
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (input.capacityMin > input.capacityMax) return
    await save.mutateAsync({ id: venue?.id, input, files })
    onOpenChange(false)
  }
  return (
    <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
      <DialogHeader>
        <DialogTitle>{venue ? '编辑场地' : '新增场地'}</DialogTitle>
        <DialogDescription>
          维护场地容量、踩点记录、联系人及照片。
        </DialogDescription>
      </DialogHeader>
      <form className='grid gap-4 sm:grid-cols-2' onSubmit={submit}>
        <Field label='场地名称'>
          <Input
            required
            value={input.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label='类型'>
          <Select
            value={input.type}
            onValueChange={(v) => set('type', v as VenueType)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {venueTypes.map((v) => (
                <SelectItem key={v} value={v}>
                  {venueTypeLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label='城市'>
          <Input
            required
            value={input.city}
            onChange={(e) => set('city', e.target.value)}
          />
        </Field>
        <Field label='详细地址'>
          <Input
            value={input.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </Field>
        <Field label='最少容纳人数'>
          <Input
            type='number'
            min={0}
            value={input.capacityMin}
            onChange={(e) => set('capacityMin', Number(e.target.value))}
          />
        </Field>
        <Field label='最多容纳人数'>
          <Input
            type='number'
            min={0}
            value={input.capacityMax}
            onChange={(e) => set('capacityMax', Number(e.target.value))}
          />
        </Field>
        {input.capacityMin > input.capacityMax && (
          <p className='text-sm text-destructive sm:col-span-2'>
            最少人数不能大于最多人数
          </p>
        )}
        <Field label='价格区间'>
          <Input
            placeholder='8000-15000/场'
            value={input.priceRange}
            onChange={(e) => set('priceRange', e.target.value)}
          />
        </Field>
        <Field label='场景标签'>
          <Input
            placeholder='私密,海景,有LED屏'
            value={input.sceneTags}
            onChange={(e) => set('sceneTags', e.target.value)}
          />
        </Field>
        <Field label='联系人'>
          <Input
            value={input.contactName}
            onChange={(e) => set('contactName', e.target.value)}
          />
        </Field>
        <Field label='联系电话'>
          <Input
            value={input.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
          />
        </Field>
        <Field label='场地优势'>
          <Textarea
            value={input.pros}
            onChange={(e) => set('pros', e.target.value)}
          />
        </Field>
        <Field label='场地不足'>
          <Textarea
            value={input.cons}
            onChange={(e) => set('cons', e.target.value)}
          />
        </Field>
        <Field label='最近踩点日期'>
          <Input
            type='date'
            value={input.siteVisitDate.slice(0, 10)}
            onChange={(e) => set('siteVisitDate', e.target.value)}
          />
        </Field>
        <Field label='踩点记录'>
          <Textarea
            value={input.siteVisitNotes}
            onChange={(e) => set('siteVisitNotes', e.target.value)}
          />
        </Field>
        <Field label='场地照片（最多 10 张）'>
          <Input
            type='file'
            accept='image/*'
            multiple
            onChange={(e) =>
              setFiles(Array.from(e.target.files ?? []).slice(0, 10))
            }
          />
        </Field>
        <label className='flex items-center gap-2 self-end pb-2 text-sm'>
          <input
            type='checkbox'
            checked={input.isVerified}
            onChange={(e) => set('isVerified', e.target.checked)}
          />{' '}
          已验证可用
        </label>
        <DialogFooter className='sm:col-span-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            disabled={save.isPending || input.capacityMin > input.capacityMax}
          >
            {save.isPending && <LoaderCircle className='size-4 animate-spin' />}
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
