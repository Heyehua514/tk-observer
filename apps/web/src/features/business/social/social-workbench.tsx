// 商务工作台朋友圈计划 CRUD；权限：business 与 boss 可操作。
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
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
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'

type SocialPlan = {
  id: string
  date: string
  content: string
  target: string
  status: string
}
export function SocialWorkbench() {
  const cache = useQueryClient()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    date: '',
    content: '',
    target_audience: '',
    expected_outcome: '',
  })
  const plans = useQuery({
    queryKey: ['business', 'social-plans'],
    queryFn: async () =>
      (await pb.collection('social_plans').getFullList({ sort: '-date' })).map(
        (r: RecordModel): SocialPlan => ({
          id: r.id,
          date: String(r.date),
          content: String(r.content),
          target: String(r.target_audience || ''),
          status: String(r.status),
        })
      ),
  })
  const refresh = () =>
    void cache.invalidateQueries({ queryKey: ['business', 'social-plans'] })
  const create = useMutation({
    mutationFn: () =>
      pb.collection('social_plans').create({
        ...draft,
        date: `${draft.date} 00:00:00.000Z`,
        status: 'planned',
      }),
    onSuccess: () => {
      refresh()
      setOpen(false)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pb.collection('social_plans').update(id, { status }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => pb.collection('social_plans').delete(id),
    onSuccess: refresh,
  })
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Plus className='size-4' />
          新增计划
        </Button>
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>内容</TableHead>
              <TableHead>目标受众</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.data?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.date.slice(0, 10)}</TableCell>
                <TableCell className='max-w-md truncate'>
                  {item.content}
                </TableCell>
                <TableCell>{item.target || '—'}</TableCell>
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
                      <SelectItem value='planned'>已计划</SelectItem>
                      <SelectItem value='published'>已发布</SelectItem>
                      <SelectItem value='reviewed'>已复盘</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='删除计划'
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!plans.isLoading && !plans.data?.length && (
              <TableRow>
                <TableCell colSpan={5} className='p-0'>
                  <EmptyState
                    title='还没有朋友圈计划'
                    description='安排第一条内容，开始记录私域获客与转化。'
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
            <DialogTitle>新增朋友圈计划</DialogTitle>
          </DialogHeader>
          <Field label='发布日期'>
            <Input
              type='date'
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field label='发布内容'>
            <Textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
          </Field>
          <Field label='目标受众'>
            <Input
              value={draft.target_audience}
              onChange={(e) =>
                setDraft({ ...draft, target_audience: e.target.value })
              }
            />
          </Field>
          <Field label='预期转化'>
            <Input
              value={draft.expected_outcome}
              onChange={(e) =>
                setDraft({ ...draft, expected_outcome: e.target.value })
              }
            />
          </Field>
          <Button
            disabled={!draft.date || !draft.content}
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
