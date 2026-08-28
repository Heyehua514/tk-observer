/** 对标爆款视频新增/编辑表单，包含谢洁的分析笔记与可借鉴点。 */
import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import {
  useCreateCompetitorVideo,
  useUpdateCompetitorVideo,
} from '../hooks/use-competitor-videos'
import type { CompetitorVideo, CompetitorVideoInput } from '../types'

const schema = z.object({
  competitorId: z.string().min(1),
  title: z.string().trim().min(1, '请输入视频标题').max(240),
  url: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//u.test(value), '请输入有效链接'),
  publishDate: z.string(),
  views: z.number().int().min(0),
  likes: z.number().int().min(0),
  contentTags: z.string().trim().max(1000),
  whyViral: z.string().trim().max(5000),
  referenceTo: z.string().trim().max(5000),
})

export function CompetitorVideoForm({
  competitorId,
  video,
  open,
  onOpenChange,
}: {
  competitorId: string
  video: CompetitorVideo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createVideo = useCreateCompetitorVideo()
  const updateVideo = useUpdateCompetitorVideo()
  const empty = useMemo<CompetitorVideoInput>(
    () => ({
      competitorId,
      title: '',
      url: '',
      publishDate: '',
      views: 0,
      likes: 0,
      contentTags: '',
      whyViral: '',
      referenceTo: '',
    }),
    [competitorId]
  )
  const form = useForm<CompetitorVideoInput>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  })
  useEffect(() => {
    form.reset(
      video
        ? {
            competitorId: video.competitorId,
            title: video.title,
            url: video.url,
            publishDate: video.publishDate,
            views: video.views,
            likes: video.likes,
            contentTags: video.contentTags,
            whyViral: video.whyViral,
            referenceTo: video.referenceTo,
          }
        : empty
    )
  }, [empty, form, open, video])
  const submit = async (values: CompetitorVideoInput) => {
    if (video) await updateVideo.mutateAsync({ id: video.id, input: values })
    else await createVideo.mutateAsync(values)
    onOpenChange(false)
  }
  const pending = createVideo.isPending || updateVideo.isPending
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{video ? '编辑对标视频' : '新增对标视频'}</DialogTitle>
          <DialogDescription>
            爆款原因和可借鉴点由谢洁根据实际内容维护。
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频链接</FormLabel>
                  <FormControl>
                    <Input type='url' {...field} />
                  </FormControl>
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
                    <DatePicker
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      placeholder='选择发布日期'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(
              [
                ['views', '播放量'],
                ['likes', '点赞数'],
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
            <FormField
              control={form.control}
              name='contentTags'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>内容标签</FormLabel>
                  <FormControl>
                    <Input placeholder='选品,供应链,达人' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='whyViral'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>为什么爆</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='referenceTo'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>可借鉴点</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='sm:col-span-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={pending}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
