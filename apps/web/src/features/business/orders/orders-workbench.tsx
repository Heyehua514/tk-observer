// 商务工作台渠道商单 CRUD；权限：business 与 boss 可操作。
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar } from '@/components/shared/filter-bar'
import { useClients } from '../clients'
import {
  emptyOrderFilters,
  filterOrders,
  type OrderFilters,
} from './order-filters'
import { formatOrderAmount, orderAmountInput } from './order-amount'
import {
  orderContentTypeLabels,
  orderContentTypeOptions,
  orderPlatformLabels,
  orderPlatformOptions,
  orderStatusOptions,
} from './order-options'

type Order = {
  id: string
  title: string
  clientName: string
  creatorName: string
  amount: number
  status: string
  platform: string
  contentType: string
  publishDate: string
}

export function OrdersWorkbench() {
  const cache = useQueryClient()
  const clients = useClients()
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<OrderFilters>(emptyOrderFilters)
  const [draft, setDraft] = useState({
    title: '',
    client: '',
    creator: '',
    amount: '',
  })
  const orders = useQuery({
    queryKey: ['business', 'orders'],
    queryFn: async () =>
      (
        await pb
          .collection('channel_orders')
          .getFullList({ sort: '-updated', expand: 'client,creator' })
      ).map((r: RecordModel): Order => ({
        id: r.id,
        title: String(r.title),
        clientName: String(r.expand?.client?.name || '—'),
        creatorName: String(r.expand?.creator?.nickname || '—'),
        amount: Number(r.amount || 0),
        status: String(r.status),
        platform: String(r.platform || ''),
        contentType: String(r.content_type || ''),
        publishDate: String(r.publish_date || ''),
      })),
  })
  const visibleOrders = useMemo(
    () => filterOrders(orders.data || [], filters),
    [filters, orders.data]
  )
  const updateFilters = (patch: Partial<OrderFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  const creators = useQuery({
    queryKey: ['business', 'available-creators'],
    queryFn: () =>
      pb
        .collection('creators')
        .getFullList({ filter: 'is_biz_available = true', sort: 'nickname' }),
  })
  const refresh = () =>
    void cache.invalidateQueries({ queryKey: ['business', 'orders'] })
  const create = useMutation({
    mutationFn: () =>
      pb.collection('channel_orders').create({
        title: draft.title,
        client: draft.client,
        creator: draft.creator,
        amount: orderAmountInput(draft.amount) ?? 0,
        platform: 'tiktok',
        content_type: 'other',
        status: 'negotiating',
      }),
    onSuccess: () => {
      refresh()
      setOpen(false)
      toast.success('商单已新增')
    },
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pb.collection('channel_orders').update(id, { status }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => pb.collection('channel_orders').delete(id),
    onSuccess: refresh,
  })
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Plus className='size-4' />
          新增商单
        </Button>
      </div>
      <FilterBar onReset={() => setFilters(emptyOrderFilters)}>
        <Input
          className='max-w-sm'
          placeholder='搜索标题、客户或达人'
          value={filters.query}
          onChange={(event) => updateFilters({ query: event.target.value })}
        />
        <Select
          value={filters.status}
          onValueChange={(status) => updateFilters({ status })}
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='状态' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部状态</SelectItem>
            {orderStatusOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.platform}
          onValueChange={(platform) => updateFilters({ platform })}
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='平台' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部平台</SelectItem>
            {orderPlatformOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.contentType}
          onValueChange={(contentType) => updateFilters({ contentType })}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='内容类型' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部内容</SelectItem>
            {orderContentTypeOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>达人</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>内容类型</TableHead>
              <TableHead>发布日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOrders.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.title}</TableCell>
                <TableCell>{item.clientName}</TableCell>
                <TableCell>{item.creatorName}</TableCell>
                <TableCell>{formatOrderAmount(item.amount)}</TableCell>
                <TableCell>{orderPlatformLabels[item.platform] || item.platform}</TableCell>
                <TableCell>
                  {orderContentTypeLabels[item.contentType] || item.contentType}
                </TableCell>
                <TableCell>{item.publishDate?.slice(0, 10) || '—'}</TableCell>
                <TableCell>
                  <Select
                    value={item.status}
                    onValueChange={(status) =>
                      update.mutate({ id: item.id, status })
                    }
                  >
                    <SelectTrigger className='w-28'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatusOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label='删除商单'
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!orders.isLoading && visibleOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className='p-0'>
                  <EmptyState
                    title='还没有渠道商单'
                    description='新建第一条商单，开始追踪合作状态和交付结果。'
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增商单</DialogTitle>
          </DialogHeader>
          <Field label='商单标题'>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label='客户'>
            <Select
              value={draft.client}
              onValueChange={(client) => setDraft({ ...draft, client })}
            >
              <SelectTrigger>
                <SelectValue placeholder='选择客户' />
              </SelectTrigger>
              <SelectContent>
                {clients.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='可商务合作达人'>
            <Select
              value={draft.creator}
              onValueChange={(creator) => setDraft({ ...draft, creator })}
            >
              <SelectTrigger>
                <SelectValue placeholder='选择达人' />
              </SelectTrigger>
              <SelectContent>
                {creators.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {String(c.nickname)} · ¥
                    {(Number(c.cooperation_price || 0) / 100).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='金额（人民币/元）'>
            <Input
              type='number'
              value={draft.amount}
              min='0'
              step='0.01'
              onChange={(e) =>
                setDraft({ ...draft, amount: e.target.value })
              }
            />
          </Field>
          <Button
            disabled={
              !draft.title ||
              !draft.client ||
              !draft.creator ||
              orderAmountInput(draft.amount) === null
            }
            onClick={() => create.mutate()}
          >
            保存
          </Button>
        </DialogContent>
      </Dialog>
    </div>
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
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
