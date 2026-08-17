// 商务工作台客户 CRUD；权限：business 与 boss 可操作。
import { useMemo, useState } from 'react'
import { ArrowUpRight, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar } from '@/components/shared/filter-bar'
import { formatOrderAmount } from '../orders/order-amount'
import {
  emptyClientFilters,
  filterClients,
  type ClientFilters,
} from './client-filters'
import {
  clientIndustryLabels,
  clientIndustryOptions,
  clientSourceLabels,
  clientSourceOptions,
} from './client-options'
import type { Client, ClientInput } from './types'
import { useClientRelations } from './use-client-relations'
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from './use-clients'

const empty: ClientInput = {
  name: '',
  contactName: '',
  contactPhone: '',
  contactWechat: '',
  company: '',
  industry: 'other',
  source: 'other',
  level: 'C',
  notes: '',
}
export function ClientsWorkbench({
  onOpenRelated,
}: {
  onOpenRelated?: (type: 'opportunity' | 'order', id: string) => void
}) {
  const clients = useClients()
  const create = useCreateClient()
  const update = useUpdateClient()
  const remove = useDeleteClient()
  const [filters, setFilters] = useState<ClientFilters>(emptyClientFilters)
  const [editing, setEditing] = useState<Client | null>(null)
  const [viewing, setViewing] = useState<Client | null>(null)
  const [draft, setDraft] = useState<ClientInput>(empty)
  const [open, setOpen] = useState(false)
  const updateFilters = (patch: Partial<ClientFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  const filtered = useMemo(
    () => filterClients(clients.data || [], filters),
    [clients.data, filters]
  )
  const showForm = (client?: Client) => {
    setEditing(client || null)
    setDraft(
      client
        ? {
            name: client.name,
            contactName: client.contactName,
            contactPhone: client.contactPhone,
            contactWechat: client.contactWechat,
            company: client.company,
            industry: client.industry,
            source: client.source,
            level: client.level,
            notes: client.notes,
          }
        : empty
    )
    setOpen(true)
  }
  const save = async () => {
    if (!draft.name.trim()) return
    if (editing) await update.mutateAsync({ id: editing.id, input: draft })
    else await create.mutateAsync(draft)
    setOpen(false)
  }
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => showForm()}>
          <Plus className='size-4' />
          新增客户
        </Button>
      </div>
      <FilterBar onReset={() => setFilters(emptyClientFilters)}>
        <Input
          className='max-w-sm'
          placeholder='搜索客户、对接人或公司'
          value={filters.query}
          onChange={(event) => updateFilters({ query: event.target.value })}
        />
        <Select
          value={filters.industry}
          onValueChange={(industry) => updateFilters({ industry })}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='行业' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部行业</SelectItem>
            {clientIndustryOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.source}
          onValueChange={(source) => updateFilters({ source })}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='来源' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部来源</SelectItem>
            {clientSourceOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.level}
          onValueChange={(level) => updateFilters({ level })}
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='重要度' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部重要度</SelectItem>
            {['S', 'A', 'B', 'C'].map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户</TableHead>
              <TableHead>行业</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>重要度</TableHead>
              <TableHead>对接人</TableHead>
              <TableHead className='w-24' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className='font-medium'>{client.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {client.company || '独立客户'}
                  </div>
                </TableCell>
                <TableCell>
                  {clientIndustryLabels[client.industry] || client.industry}
                </TableCell>
                <TableCell>
                  {clientSourceLabels[client.source] || client.source}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{client.level}</Badge>
                </TableCell>
                <TableCell>{client.contactName || '—'}</TableCell>
                <TableCell>
                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='查看客户详情'
                    onClick={() => setViewing(client)}
                  >
                    <Eye className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='编辑客户'
                    onClick={() => showForm(client)}
                  >
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='删除客户'
                    onClick={() => remove.mutate(client.id)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!clients.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='p-0'>
                  <EmptyState
                    title='还没有客户资料'
                    description='新增第一位客户，开始沉淀合作关系与跟进记录。'
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑客户' : '新增客户'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='客户/公司名'>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label='所属公司'>
              <Input
                value={draft.company}
                onChange={(e) =>
                  setDraft({ ...draft, company: e.target.value })
                }
              />
            </Field>
            <Field label='对接人'>
              <Input
                value={draft.contactName}
                onChange={(e) =>
                  setDraft({ ...draft, contactName: e.target.value })
                }
              />
            </Field>
            <Field label='电话'>
              <Input
                value={draft.contactPhone}
                onChange={(e) =>
                  setDraft({ ...draft, contactPhone: e.target.value })
                }
              />
            </Field>
            <Field label='微信号'>
              <Input
                value={draft.contactWechat}
                onChange={(e) =>
                  setDraft({ ...draft, contactWechat: e.target.value })
                }
              />
            </Field>
            <Field label='行业'>
              <Select
                value={draft.industry}
                onValueChange={(industry) => setDraft({ ...draft, industry })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientIndustryOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label='来源'>
              <Select
                value={draft.source}
                onValueChange={(source) => setDraft({ ...draft, source })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientSourceOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label='重要度'>
              <Select
                value={draft.level}
                onValueChange={(level) =>
                  setDraft({ ...draft, level: level as ClientInput['level'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['S', 'A', 'B', 'C'].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className='sm:col-span-2'>
              <Field label='备注'>
                <Textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
          <Button disabled={!draft.name.trim()} onClick={() => void save()}>
            保存
          </Button>
        </DialogContent>
      </Dialog>
      <ClientDetailDialog
        client={viewing}
        open={Boolean(viewing)}
        onOpenRelated={onOpenRelated}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setViewing(null)
        }}
      />
    </div>
  )
}

function ClientDetailDialog({
  client,
  open,
  onOpenRelated,
  onOpenChange,
}: {
  client: Client | null
  open: boolean
  onOpenRelated?: (type: 'opportunity' | 'order', id: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const relations = useClientRelations(client?.id)
  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{client.name}</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 md:grid-cols-[240px_1fr]'>
          <section className='space-y-3 rounded-lg border p-4'>
            <Info label='所属公司' value={client.company || '独立客户'} />
            <Info
              label='行业'
              value={clientIndustryLabels[client.industry] || client.industry}
            />
            <Info
              label='来源'
              value={clientSourceLabels[client.source] || client.source}
            />
            <Info label='重要度' value={client.level} />
            <Info label='对接人' value={client.contactName || '—'} />
            <Info label='电话' value={client.contactPhone || '—'} />
            <Info label='微信' value={client.contactWechat || '—'} />
          </section>
          <section className='space-y-4'>
            <RelationBlock
              type='opportunity'
              title='关联商机'
              empty='该客户还没有商机'
              items={(relations.data?.opportunities || []).map((item) => ({
                id: item.id,
                title: item.title,
                meta: `${formatOrderAmount(item.amount)} · ${item.probability}% · ${item.stage}`,
              }))}
              loading={relations.isLoading}
              onOpenRelated={onOpenRelated}
            />
            <RelationBlock
              type='order'
              title='关联商单'
              empty='该客户还没有商单'
              items={(relations.data?.orders || []).map((item) => ({
                id: item.id,
                title: item.title,
                meta: `${formatOrderAmount(item.amount)} · ${item.status} · ${
                  item.publishDate?.slice(0, 10) || '未排期'
                }`,
              }))}
              loading={relations.isLoading}
              onOpenRelated={onOpenRelated}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-sm font-medium'>{value}</div>
    </div>
  )
}

export function RelationBlock({
  type,
  title,
  empty,
  items,
  loading,
  onOpenRelated,
}: {
  type: 'opportunity' | 'order'
  title: string
  empty: string
  items: { id: string; title: string; meta: string }[]
  loading: boolean
  onOpenRelated?: (type: 'opportunity' | 'order', id: string) => void
}) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-sm font-medium'>{title}</h3>
        <Badge variant='secondary'>{items.length}</Badge>
      </div>
      {loading ? (
        <div className='text-sm text-muted-foreground'>正在加载关联数据…</div>
      ) : items.length ? (
        <div className='space-y-2'>
          {items.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => onOpenRelated?.(type, item.id)}
              className='group flex w-full items-center justify-between gap-2 rounded-md bg-muted/40 p-3 text-left transition-colors hover:bg-muted'
            >
              <div className='min-w-0'>
                <div className='truncate text-sm font-medium'>{item.title}</div>
                <div className='mt-1 truncate text-xs text-muted-foreground'>
                  {item.meta}
                </div>
              </div>
              <ArrowUpRight className='size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
            </button>
          ))}
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>{empty}</div>
      )}
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
