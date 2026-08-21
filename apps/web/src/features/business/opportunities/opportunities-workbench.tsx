// 商务工作台商机 Pipeline；权限：business 与 boss 可操作。
import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import { useClients } from '../clients'
import { StatusHistoryChip } from '../history/status-history-chip'
import { formatCny, opportunityCreateInput } from './opportunity-amount'
import { opportunityCreatePayload } from './opportunity-create'
import {
  opportunityDetailPatch,
  type OpportunityDetailDraft,
} from './opportunity-detail'
import {
  mapOpportunityRecord,
  serializeOpportunityPayload,
} from './opportunity-mapper'
import {
  opportunityStagePatch,
  opportunityStages,
  type OpportunityStage,
} from './opportunity-rules'
import { opportunityDueText, type OpportunityView } from './opportunity-view'

const labels: Record<OpportunityStage, string> = {
  contact: '初步接洽',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签署',
  won: '已成交',
  lost: '已流失',
}

export function OpportunitiesWorkbench({ focusId }: { focusId?: string }) {
  const queryClient = useQueryClient()
  const clients = useClients()
  const opportunities = useQuery({
    queryKey: ['business', 'opportunities'],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('opportunities')
          .select('*, clients(name)')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapOpportunityRecord)
      }
      return (
        await pb
          .collection('opportunities')
          .getFullList({ sort: '-updated', expand: 'client' })
      ).map(mapOpportunityRecord)
    },
  })
  const mutate = useMutation({
    mutationFn: async ({
      id,
      stage,
      lostReason,
    }: {
      id: string
      stage: OpportunityStage
      lostReason?: string
    }) => {
      const patch = opportunityStagePatch(stage, lostReason)
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('opportunities')
          .update(patch)
          .eq('id', id)
        if (error) throw error
        return
      }
      await pb.collection('opportunities').update(id, patch)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business', 'opportunities'],
      })
      toast.success('商机阶段已更新')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === 'LOST_REASON_REQUIRED'
          ? '流失原因必填'
          : '更新失败'
      ),
  })
  const create = useMutation({
    mutationFn: async (
      data: NonNullable<ReturnType<typeof opportunityCreatePayload>>
    ) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('opportunities')
          .insert(serializeOpportunityPayload(data))
        if (error) throw error
        return
      }
      await pb.collection('opportunities').create(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business', 'opportunities'],
      })
      setOpen(false)
      toast.success('商机已新增')
    },
  })
  const updateDetail = useMutation({
    mutationFn: async ({
      id,
      draft,
    }: {
      id: string
      draft: OpportunityDetailDraft
    }) => {
      const patch = opportunityDetailPatch(draft)
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('opportunities')
          .update(patch)
          .eq('id', id)
        if (error) throw error
        return
      }
      await pb.collection('opportunities').update(id, patch)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business', 'opportunities'],
      })
      setSelected(null)
      toast.success('商机详情已更新')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === 'LOST_REASON_REQUIRED'
          ? '流失原因必填'
          : '更新失败'
      ),
  })
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<OpportunityView | null>(null)
  const [client, setClient] = useState('')
  const [createExpectedClose, setCreateExpectedClose] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [lostTarget, setLostTarget] = useState<{ id: string } | null>(null)
  const [lostReason, setLostReason] = useState('')

  /** 统一入口：拖到已流失先弹自定义对话框收集原因，其余阶段直接流转。 */
  const requestStageChange = (id: string, stage: OpportunityStage) => {
    if (stage === 'lost') {
      setLostReason('')
      setLostTarget({ id })
      return
    }
    mutate.mutate({ id, stage })
  }
  const reduceMotion = useReducedMotion()
  const consumedFocus = useRef<string | null>(null)
  useEffect(() => {
    if (!focusId || focusId === consumedFocus.current) return
    const item = opportunities.data?.find((row) => row.id === focusId)
    if (item) {
      consumedFocus.current = focusId
      setSelected(item)
    }
  }, [focusId, opportunities.data])
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Plus className='size-4' />
          新增商机
        </Button>
      </div>
      <div className='grid min-w-[900px] grid-cols-6 gap-3 overflow-x-auto'>
        {opportunityStages.map((stage) => (
          <section
            key={stage}
            className='min-h-72 rounded-lg border bg-muted/30 p-3'
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData('text/plain')
              if (id) requestStageChange(id, stage)
            }}
          >
            <div className='mb-3 flex items-center justify-between text-sm font-medium'>
              <span>{labels[stage]}</span>
              <Badge variant='secondary'>
                {opportunities.data?.filter((item) => item.stage === stage)
                  .length || 0}
              </Badge>
            </div>
            <div className='space-y-2'>
              {opportunities.data
                ?.filter((item) => item.stage === stage)
                .map((item) => (
                  <motion.article
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      const dragEvent = event as unknown as DragEvent
                      dragEvent.dataTransfer?.setData('text/plain', item.id)
                      setDraggingId(item.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    animate={
                      draggingId === item.id && !reduceMotion
                        ? {
                            scale: 1.02,
                            boxShadow: '0 16px 30px rgba(15,23,42,.16)',
                          }
                        : {
                            scale: 1,
                            boxShadow: '0 1px 2px rgba(15,23,42,.06)',
                          }
                    }
                    className='cursor-grab rounded-md border bg-background p-3 shadow-sm'
                    onClick={() => setSelected(item)}
                  >
                    <div className='text-sm font-medium'>{item.title}</div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {item.clientName}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {opportunityDueText(item.expectedClose)}
                    </div>
                    <div className='mt-2 flex justify-between text-xs'>
                      <span>{formatCny(item.amount)}</span>
                      <span>{item.probability}%</span>
                    </div>
                    {item.notes && (
                      <div className='mt-2 line-clamp-2 text-xs text-muted-foreground'>
                        {item.notes}
                      </div>
                    )}
                    <div className='mt-2'>
                      <StatusHistoryChip
                        entityType='opportunity'
                        entityId={item.id}
                      />
                    </div>
                  </motion.article>
                ))}
            </div>
          </section>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setClient('')
            setCreateExpectedClose('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增商机</DialogTitle>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const input = opportunityCreateInput({
                title: String(form.get('title') || ''),
                client: String(form.get('client') || ''),
                amount: String(form.get('amount') || ''),
              })
              const payload = input
                ? opportunityCreatePayload({
                    ...input,
                    amount: String(form.get('amount') || ''),
                    expectedClose: String(form.get('expectedClose') || ''),
                    notes: String(form.get('notes') || ''),
                  })
                : null
              if (payload) create.mutate(payload)
            }}
          >
            <Field label='商机名称'>
              <Input name='title' required />
            </Field>
            <Field label='客户'>
              <Select value={client} onValueChange={setClient}>
                <SelectTrigger>
                  <SelectValue placeholder='选择客户' />
                </SelectTrigger>
                <SelectContent>
                  {clients.data?.map((client) => (
                    <SelectItem value={client.id} key={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input name='client' type='hidden' value={client} readOnly />
            </Field>
            <Field label='预计金额（人民币/元）'>
              <Input type='number' name='amount' min='0' step='0.01' required />
            </Field>
            <Field label='预计成交日期'>
              <DatePicker
                selected={
                  createExpectedClose
                    ? parseISO(createExpectedClose)
                    : undefined
                }
                onSelect={(date) =>
                  setCreateExpectedClose(date ? format(date, 'yyyy-MM-dd') : '')
                }
                allowFuture
                placeholder='选择预计成交日期'
              />
              <input
                name='expectedClose'
                type='hidden'
                value={createExpectedClose}
                readOnly
              />
            </Field>
            <Field label='跟进备注'>
              <Input name='notes' placeholder='记录下一步动作或客户反馈' />
            </Field>
            <Button type='submit' disabled={create.isPending}>
              保存
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(lostTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setLostTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>标记为已流失</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            该商机将进入「已流失」列，请填写流失原因以便沉淀复盘。
          </p>
          <Field label='流失原因（必填）'>
            <Textarea
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
              placeholder='填写流失原因，如：客户预算调整、合作未谈拢'
            />
          </Field>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setLostTarget(null)}
            >
              取消
            </Button>
            <Button
              disabled={!lostReason.trim() || mutate.isPending}
              onClick={() => {
                if (!lostTarget) return
                mutate.mutate(
                  { id: lostTarget.id, stage: 'lost', lostReason },
                  { onSettled: () => setLostTarget(null) }
                )
              }}
            >
              确认已流失
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <OpportunityDetailDialog
        key={selected?.id || 'empty'}
        opportunity={selected}
        saving={updateDetail.isPending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelected(null)
        }}
        onSave={(draft) => {
          if (selected) updateDetail.mutate({ id: selected.id, draft })
        }}
      />
    </div>
  )
}

function OpportunityDetailDialog({
  opportunity,
  saving,
  onOpenChange,
  onSave,
}: {
  opportunity: OpportunityView | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (draft: OpportunityDetailDraft) => void
}) {
  const [draft, setDraft] = useState<OpportunityDetailDraft>({
    stage: opportunity?.stage || 'contact',
    expectedClose: opportunity?.expectedClose?.slice(0, 10) || '',
    notes: opportunity?.notes || '',
    lostReason: '',
  })

  if (!opportunity) return null

  return (
    <Dialog open={Boolean(opportunity)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{opportunity.title}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <Info label='客户' value={opportunity.clientName} />
            <Info label='预计金额' value={formatCny(opportunity.amount)} />
          </div>
          <Field label='阶段'>
            <Select
              value={draft.stage}
              onValueChange={(stage) =>
                setDraft({ ...draft, stage: stage as OpportunityStage })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opportunityStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {labels[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='预计成交日期'>
            <DatePicker
              selected={
                draft.expectedClose ? parseISO(draft.expectedClose) : undefined
              }
              onSelect={(date) =>
                setDraft({
                  ...draft,
                  expectedClose: date ? format(date, 'yyyy-MM-dd') : '',
                })
              }
              allowFuture
              placeholder='选择预计成交日期'
            />
          </Field>
          <Field label='跟进备注'>
            <Input
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
            />
          </Field>
          {draft.stage === 'lost' && (
            <Field label='流失原因'>
              <Input
                value={draft.lostReason}
                onChange={(event) =>
                  setDraft({ ...draft, lostReason: event.target.value })
                }
              />
            </Field>
          )}
          <Button disabled={saving} onClick={() => onSave(draft)}>
            保存详情
          </Button>
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
