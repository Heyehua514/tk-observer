// 商务工作台渠道商单 CRUD；权限：business 与 boss 可操作。
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { buildOrderDisplay } from './order-display'
import { orderCreatePayload } from './order-create'
import { mapOrderRecord, serializeOrderPayload, type OrderRow } from './order-mapper'
import { orderStatusUpdatePayload } from './order-status-update'
import {
  orderContentTypeOptions,
  orderPlatformOptions,
  orderStatusOptions,
} from './order-options'

export function OrdersWorkbench({
  focusId,
}: {
  focusId?: string
}) {
  const cache = useQueryClient()
  const clients = useClients()
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState<OrderRow | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [filters, setFilters] = useState<OrderFilters>(emptyOrderFilters)
  const [draft, setDraft] = useState({
    title: '',
    client: '',
    creator: '',
    amount: '',
    platform: 'tiktok',
    contentType: 'other',
    publishDate: '',
  })
  const orders = useQuery({
    queryKey: ['business', 'orders'],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('channel_orders')
          .select('*, clients(name), creators(nickname)')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapOrderRecord)
      }
      return (
        await pb
          .collection('channel_orders')
          .getFullList({ sort: '-updated', expand: 'client,creator' })
      ).map(mapOrderRecord)
    },
  })
  const visibleOrders = useMemo(
    () => filterOrders(orders.data || [], filters),
    [filters, orders.data]
  )
  const updateFilters = (patch: Partial<OrderFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  const creators = useQuery({
    queryKey: ['business', 'available-creators'],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('creators')
          .select('id, nickname, cooperation_price')
          .eq('is_biz_available', true)
          .is('deleted_at', null)
          .order('nickname')
        if (error) throw error
        return data || []
      }
      return pb
        .collection('creators')
        .getFullList({ filter: 'is_biz_available = true', sort: 'nickname' })
    },
  })
  const refresh = () =>
    void cache.invalidateQueries({ queryKey: ['business', 'orders'] })
  const create = useMutation({
    mutationFn: async () => {
      const payload = orderCreatePayload(draft)
      if (!payload) throw new Error('INVALID_ORDER_DRAFT')
      if (getDataProvider() === 'supabase') {
        await getSupabaseClient()
          .from('channel_orders')
          .insert(serializeOrderPayload(payload))
          .then(({ error }) => {
            if (error) throw error
          })
        return
      }
      await pb.collection('channel_orders').create(payload)
    },
    onSuccess: () => {
      refresh()
      setOpen(false)
      toast.success('商单已新增')
    },
  })
  const update = useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string
      status: string
      reason: string
    }) => {
      const payload = orderStatusUpdatePayload(status, reason)
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('channel_orders')
          .update(payload)
          .eq('id', id)
        if (error) throw error
        return
      }
      await pb.collection('channel_orders').update(id, payload)
    },
    onSuccess: refresh,
    onError: () => toast.error('状态更新失败，请重试'),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('channel_orders')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return
      }
      await pb.collection('channel_orders').delete(id)
    },
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
              <OrderRow
                key={item.id}
                item={item}
                highlighted={item.id === focusId}
                onStatusChange={(status) => {
                  if (status === 'cancelled') {
                    setCancelReason('')
                    setCancelling(item)
                    return
                  }
                  update.mutate({ id: item.id, status, reason: '' })
                }}
                onRemove={() => remove.mutate(item.id)}
              />
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
      <Dialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消商单</DialogTitle>
          </DialogHeader>
          <Field label='取消原因（必填）'>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder='填写取消原因，如：客户预算调整'
            />
          </Field>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setCancelling(null)}
            >
              暂不取消
            </Button>
            <Button
              disabled={!cancelReason.trim()}
              onClick={() => {
                if (!cancelling) return
                update.mutate({
                  id: cancelling.id,
                  status: 'cancelled',
                  reason: cancelReason,
                })
                setCancelling(null)
              }}
            >
              确认取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
          <Field label='平台'>
            <Select
              value={draft.platform}
              onValueChange={(platform) => setDraft({ ...draft, platform })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orderPlatformOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='内容类型'>
            <Select
              value={draft.contentType}
              onValueChange={(contentType) =>
                setDraft({ ...draft, contentType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orderContentTypeOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='预计发布日期'>
            <Input
              type='date'
              value={draft.publishDate}
              onChange={(e) =>
                setDraft({ ...draft, publishDate: e.target.value })
              }
            />
          </Field>
          <Button
            disabled={!orderCreatePayload(draft)}
            onClick={() => create.mutate()}
          >
            保存
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderRow({
  item,
  highlighted,
  onStatusChange,
  onRemove,
}: {
  item: OrderRow
  highlighted: boolean
  onStatusChange: (status: string) => void
  onRemove: () => void
}) {
  const display = buildOrderDisplay(item)
  return (
    <TableRow
      data-order-id={item.id}
      className={highlighted ? 'bg-primary/5' : undefined}
      ref={highlighted ? (el) => el?.scrollIntoView({ block: 'center' }) : undefined}
    >
      <TableCell className='font-medium'>{item.title}</TableCell>
      <TableCell>{item.clientName}</TableCell>
      <TableCell>{item.creatorName}</TableCell>
      <TableCell>{display.amount}</TableCell>
      <TableCell>{display.platform}</TableCell>
      <TableCell>{display.contentType}</TableCell>
      <TableCell>{display.publishDate}</TableCell>
      <TableCell>
        <Select value={item.status} onValueChange={onStatusChange}>
          <SelectTrigger
            className='w-28'
            title={
              item.cancelReason
                ? `取消原因：${item.cancelReason}`
                : undefined
            }
          >
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
          onClick={onRemove}
        >
          <Trash2 className='size-4' />
        </Button>
      </TableCell>
    </TableRow>
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
