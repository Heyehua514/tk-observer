// 商务工作台客户 CRUD；权限：business 与 boss 可操作。
import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import type { Client, ClientInput } from './types'
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
const industries = [
  ['tiktok_service', 'TikTok服务商'],
  ['brand', '品牌方'],
  ['mcn', 'MCN'],
  ['supply_chain', '供应链'],
  ['ad_agency', '广告代理'],
  ['other', '其他'],
] as const
const sources = [
  ['social', '朋友圈获客'],
  ['referral', '老客户转介绍'],
  ['event', '活动获客'],
  ['outbound', '主动开发'],
  ['other', '其他'],
] as const

export function ClientsWorkbench() {
  const clients = useClients()
  const create = useCreateClient()
  const update = useUpdateClient()
  const remove = useDeleteClient()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)
  const [draft, setDraft] = useState<ClientInput>(empty)
  const [open, setOpen] = useState(false)
  const filtered = useMemo(
    () =>
      (clients.data || []).filter((item) =>
        `${item.name} ${item.contactName} ${item.company}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [clients.data, query]
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
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Input
          className='max-w-sm'
          placeholder='搜索客户、对接人或公司'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button onClick={() => showForm()}>
          <Plus className='size-4' />
          新增客户
        </Button>
      </div>
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
                  {industries.find(([value]) => value === client.industry)?.[1]}
                </TableCell>
                <TableCell>
                  {sources.find(([value]) => value === client.source)?.[1]}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{client.level}</Badge>
                </TableCell>
                <TableCell>{client.contactName || '—'}</TableCell>
                <TableCell>
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
                  {industries.map(([value, label]) => (
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
                  {sources.map(([value, label]) => (
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
