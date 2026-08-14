/**
 * 剪辑工作台 - 发布排期新增/编辑表单。
 * 路由：/editing production 区；权限：editing, boss。
 * publish_at 按本地时间输入，存储为 timestamptz；前端展示时按北京时间和站点当地时间双重标注。
 */
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { videoAccounts } from '../constants'
import { useCreatePublishSchedule } from '../hooks/use-create-publish-schedule'
import { useUpdatePublishSchedule } from '../hooks/use-update-publish-schedule'
import { publishScheduleStatusLabels as statusLabels } from './production-model'
import type {
  PublishPlatform,
  PublishScheduleInput,
  PublishScheduleStatus,
  VideoAccount,
} from '../types'

const platforms = ['微信视频号', 'TikTok', '抖音', 'YouTube'] as const
const statuses = [
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
] as const

const schema = z.object({
  title: z.string().trim().min(1, '请输入发布标题').max(200),
  account: z.enum(videoAccounts),
  region: z.string().trim().min(1, '请输入目标站点').max(20),
  platform: z.enum(platforms),
  publishAt: z.string().min(1, '请选择发布时间'),
  status: z.enum(statuses),
  notes: z.string().trim().max(1000),
})

type ScheduleFormValues = Omit<PublishScheduleInput, 'videoId' | 'videoTaskId'> & {
  account: VideoAccount
  region: string
  platform: PublishPlatform
  publishAt: string
  status: PublishScheduleStatus
}

const emptyValues: PublishScheduleInput = {
  videoId: '',
  videoTaskId: '',
  title: '',
  account: '跨境TK磊哥',
  region: 'CN',
  platform: '微信视频号',
  publishAt: '',
  status: 'scheduled',
  notes: '',
}

function toLocalInput(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PublishScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  scheduleId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: PublishScheduleInput | null
  scheduleId?: string
}) {
  const createSchedule = useCreatePublishSchedule()
  const updateSchedule = useUpdatePublishSchedule()
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        schedule
          ? { ...schedule, publishAt: toLocalInput(schedule.publishAt) }
          : emptyValues
      )
    }
  }, [form, open, schedule])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const payload: PublishScheduleInput = {
        ...values,
        videoId: schedule?.videoId || '',
        videoTaskId: schedule?.videoTaskId || '',
        publishAt: new Date(values.publishAt).toISOString(),
      }
      if (scheduleId) {
        await updateSchedule.mutateAsync({ id: scheduleId, input: payload })
      } else {
        await createSchedule.mutateAsync(payload)
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {scheduleId ? '编辑发布排期' : '新建发布排期'}
          </DialogTitle>
          <DialogDescription>
            填写发布标题、账号、平台与发布时间；保存后可在列表中流转状态。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>发布标题</FormLabel>
                  <FormControl>
                    <Input placeholder='如：厦门闭门沙龙切片' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='account'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>视频号账号</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {videoAccounts.map((account) => (
                          <SelectItem key={account} value={account}>
                            {account}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='platform'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发布平台</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='region'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标站点</FormLabel>
                    <FormControl>
                      <Input placeholder='如 CN / US' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='publishAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发布时间</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='如：配合海外黄金时段，主推完播率'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting && <LoaderCircle className='animate-spin' />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
