/**
 * 爆款选题库 - 新增/编辑表单。
 * 路由：/editing；权限：editing, boss。
 * is_viral 是服务端计算字段，表单永远不接收用户输入。
 */
import { useEffect } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
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
import { accountVideoTypes, videoAccounts, videoTypes } from '../constants'
import { useCreateVideoIdea } from '../hooks/use-create-video-idea'
import { useUpdateVideoIdea } from '../hooks/use-update-video-idea'
import type { VideoIdea, VideoIdeaInput } from '../types'

const schema = z
  .object({
    account: z.enum(videoAccounts),
    videoType: z.enum(videoTypes),
    title: z.string().trim().min(1, '请输入视频标题').max(240),
    description: z.string().trim().max(5000),
    sourceUrl: z
      .string()
      .trim()
      .refine(
        (value) => !value || /^https?:\/\//u.test(value),
        '请输入有效链接'
      ),
    tags: z.string().trim().max(1000),
    publishDate: z.string().min(1, '请选择发布日期'),
    views: z.number().int().min(0, '播放量不能为负数'),
    likes: z.number().int().min(0, '点赞数不能为负数'),
    comments: z.number().int().min(0, '评论数不能为负数'),
    shares: z.number().int().min(0, '转发数不能为负数'),
    completionRate: z
      .number()
      .int()
      .min(0, '完播率不能为负数')
      .max(100, '完播率不能超过 100'),
    followerGain: z.number().int().min(0, '涨粉数不能为负数'),
  })
  .superRefine((value, context) => {
    if (!accountVideoTypes[value.account].includes(value.videoType)) {
      context.addIssue({
        code: 'custom',
        path: ['videoType'],
        message: '该账号不支持此视频类型',
      })
    }
  })

const emptyValues: VideoIdeaInput = {
  account: '跨境TK磊哥',
  videoType: '口播',
  title: '',
  description: '',
  sourceUrl: '',
  tags: '',
  publishDate: new Date().toISOString().slice(0, 10),
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  completionRate: 0,
  followerGain: 0,
}

export function VideoIdeaFormDialog({
  open,
  onOpenChange,
  idea,
  initialValues,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea: VideoIdea | null
  initialValues?: Partial<VideoIdeaInput>
}) {
  const createIdea = useCreateVideoIdea()
  const updateIdea = useUpdateVideoIdea()
  const form = useForm<VideoIdeaInput>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (idea) {
      form.reset({
        account: idea.account,
        videoType: idea.videoType,
        title: idea.title,
        description: idea.description,
        sourceUrl: idea.sourceUrl,
        tags: idea.tags,
        publishDate: idea.publishDate,
        views: idea.views,
        likes: idea.likes,
        comments: idea.comments,
        shares: idea.shares,
        completionRate: idea.completionRate,
        followerGain: idea.followerGain,
      })
    } else {
      form.reset({ ...emptyValues, ...initialValues })
    }
  }, [form, idea, initialValues, open])

  const submit = async (values: VideoIdeaInput) => {
    if (idea) await updateIdea.mutateAsync({ id: idea.id, input: values })
    else await createIdea.mutateAsync(values)
    onOpenChange(false)
  }
  const pending = createIdea.isPending || updateIdea.isPending
  const selectedAccount = useWatch({ control: form.control, name: 'account' })
  const selectedVideoType = useWatch({
    control: form.control,
    name: 'videoType',
  })
  const validVideoTypes = accountVideoTypes[selectedAccount]
  useEffect(() => {
    if (!validVideoTypes.includes(selectedVideoType)) {
      form.setValue('videoType', validVideoTypes[0], {
        shouldValidate: true,
      })
    }
  }, [form, selectedVideoType, validVideoTypes])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{idea ? '编辑视频选题' : '新增视频选题'}</DialogTitle>
          <DialogDescription>
            指标保存为整数；爆款状态由服务端按完播率和账号平均播放量自动计算。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className='grid gap-4 sm:grid-cols-2'
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>视频标题</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='例如：东南亚选品最容易踩的 3 个坑'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='account'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账号</FormLabel>
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
              name='videoType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频类型</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {validVideoTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name='publishDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>发布日期</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sourceUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原视频链接（可选）</FormLabel>
                  <FormControl>
                    <Input
                      type='url'
                      placeholder='https://channels.weixin.qq.com/...'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input placeholder='达人对接,选品逻辑' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>内容简述</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(
              [
                ['views', '播放量'],
                ['likes', '点赞数'],
                ['comments', '评论数'],
                ['shares', '转发数'],
                ['completionRate', '完播率（%）'],
                ['followerGain', '涨粉数'],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        max={name === 'completionRate' ? 100 : undefined}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter className='sm:col-span-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={pending}>
                {pending && <LoaderCircle className='size-4 animate-spin' />}
                {idea ? '保存修改' : '新增选题'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
