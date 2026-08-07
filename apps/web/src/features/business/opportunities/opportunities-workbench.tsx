// 商务工作台商机 Pipeline；权限：business 与 boss 可操作。
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
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
import { useClients } from '../clients'
import { formatCny, opportunityCreateInput } from './opportunity-amount'
import {
  opportunityStagePatch,
  opportunityStages,
  type OpportunityStage,
} from './opportunity-rules'

type Opportunity = {
  id: string
  client: string
  clientName: string
  title: string
  amount: number
  stage: OpportunityStage
  probability: number
}
const labels: Record<OpportunityStage, string> = {
  contact: '初步接洽',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签署',
  won: '已成交',
  lost: '已流失',
}

export function OpportunitiesWorkbench() {
  const queryClient = useQueryClient()
  const clients = useClients()
  const opportunities = useQuery({
    queryKey: ['business', 'opportunities'],
    queryFn: async () =>
      (
        await pb
          .collection('opportunities')
          .getFullList({ sort: '-updated', expand: 'client' })
      ).map((record: RecordModel): Opportunity => ({
        id: record.id,
        client: String(record.client),
        clientName: String(record.expand?.client?.name || '未知客户'),
        title: String(record.title),
        amount: Number(record.amount || 0),
        stage: record.stage as OpportunityStage,
        probability: Number(record.probability || 0),
      })),
  })
  const mutate = useMutation({
    mutationFn: async ({
      id,
      stage,
    }: {
      id: string
      stage: OpportunityStage
    }) => {
      let reason = ''
      if (stage === 'lost') reason = window.prompt('请输入流失原因') || ''
      await pb
        .collection('opportunities')
        .update(id, opportunityStagePatch(stage, reason))
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
    mutationFn: async (data: {
      title: string
      client: string
      amount: number
    }) =>
      pb.collection('opportunities').create({
        ...data,
        type: 'other',
        ...opportunityStagePatch('contact'),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business', 'opportunities'],
      })
      setOpen(false)
      toast.success('商机已新增')
    },
  })
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()
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
              if (id) mutate.mutate({ id, stage })
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
                  >
                    <div className='text-sm font-medium'>{item.title}</div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {item.clientName}
                    </div>
                    <div className='mt-2 flex justify-between text-xs'>
                      <span>{formatCny(item.amount)}</span>
                      <span>{item.probability}%</span>
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
          if (!nextOpen) setClient('')
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
              if (input) create.mutate(input)
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
            <Button type='submit' disabled={create.isPending}>
              保存
            </Button>
          </form>
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
