/**
 * 剪辑工作台「视频任务」新增/编辑弹窗。
 * 用途：C1 补全视频任务真 CRUD 的录入/编辑/状态流转（参照发布排期内联弹窗模式）。
 */
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
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
import { DatePicker } from '@/components/date-picker'
import {
  useCreateVideoTask,
  useUpdateVideoTask,
} from '../hooks/use-create-video-task'
import type { VideoTaskItem } from './production-model'

const statuses = ['todo', 'editing', 'review', 'done'] as const
const statusLabels: Record<string, string> = {
  todo: '待处理',
  editing: '制作中',
  review: '待审核',
  done: '已完成',
}
const regionOptions = ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG']
const owners = ['谢洁', '磊哥', '杨振康', '董雨辰', '韩素云', '孙铭泽'] as const

const schema = z.object({
  title: z.string().trim().min(1, '请输入任务标题').max(180),
  owner: z.string().min(1, '请选择负责人'),
  region: z.string().min(1, '请选择目标站点'),
  status: z.enum(statuses),
  dueAt: z.string(),
})

type VideoTaskFormValues = {
  title: string
  owner: string
  region: string
  status: (typeof statuses)[number]
  dueAt: string
}

export function VideoTaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: VideoTaskItem | null
}) {
  const create = useCreateVideoTask()
  const update = useUpdateVideoTask()
  const [initial] = useState(() => (task?.subtitle ?? '').split('·'))
  const [productName, setProductName] = useState(() => initial[0] ?? '')
  const [creatorName, setCreatorName] = useState(() => initial[1] ?? '')

  const form = useForm<VideoTaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      owner: '谢洁',
      region: 'US',
      status: 'todo',
      dueAt: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      title: task?.title ?? '',
      owner: (task?.owner as string) || '谢洁',
      region: 'US',
      status: (task?.status as (typeof statuses)[number]) ?? 'todo',
      dueAt: task?.dueAt ?? '',
    })
  }, [open, task, form])

  const submit = async (values: VideoTaskFormValues) => {
    if (task) {
      await update.mutateAsync({
        id: task.id,
        input: {
          title: values.title,
          owner: values.owner,
          region: values.region,
          status: values.status,
          dueAt: values.dueAt,
          productName,
          creatorName,
        },
      })
    } else {
      await create.mutateAsync({
        title: values.title,
        owner: values.owner,
        region: values.region,
        status: values.status,
        dueAt: values.dueAt,
        productName,
        creatorName,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={task?.id ?? 'new'} className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{task ? '编辑视频任务' : '新增视频任务'}</DialogTitle>
          <DialogDescription>
            登记剪辑任务、负责人、目标站点和状态。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务标题</FormLabel>
                  <FormControl>
                    <Input placeholder='例如：金鳞会专访正片剪辑' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='owner'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>负责人</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {owners.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
                name='region'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标站点</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
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
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabels[s]}
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
                name='dueAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>截止日期</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={
                          field.value ? parseISO(field.value) : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        allowFuture
                        placeholder='选择截止日期'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <FormLabel>关联商品</FormLabel>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder='选品名称（可选）'
                />
              </div>
              <div>
                <FormLabel>关联达人</FormLabel>
                <Input
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder='合作达人（可选）'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type='submit'
                disabled={create.isPending || update.isPending}
              >
                {(create.isPending || update.isPending) && (
                  <LoaderCircle className='size-4 animate-spin' />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
