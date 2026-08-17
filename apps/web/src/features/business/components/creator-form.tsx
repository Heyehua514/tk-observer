/**
 * 达人管理 - 新增/编辑表单
 * 依赖：react-hook-form、zod、PocketBase mutations
 * 后续模块照此模板复制，只替换 schema、字段与 mutation。
 */
import { useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  cooperationStatuses,
  cooperationStatusLabels,
  regions,
} from '../constants'
import { useCreateCreator } from '../hooks/use-create-creator'
import { useUpdateCreator } from '../hooks/use-update-creator'
import type { Creator, CreatorInput } from '../types'

const creatorSchema = z.object({
  nickname: z.string().trim().min(1, '请输入达人昵称').max(120),
  tiktokUrl: z.string().trim().url('请输入有效的 TikTok 主页地址'),
  followers: z.number().int('粉丝量必须为整数').min(0, '粉丝量不能为负数'),
  region: z.enum(regions),
  cooperationStatus: z.enum(cooperationStatuses),
  commissionRate: z
    .number()
    .min(0, '佣金不能低于 0%')
    .max(100, '佣金不能超过 100%'),
  owner: z.string().trim().min(1, '请输入对接人').max(40),
  isBizAvailable: z.boolean(),
  cooperationPrice: z
    .number()
    .int('报价必须为整数')
    .min(0, '报价不能为负数')
    .max(100_000_000, '报价超出上限'),
  cooperationNotes: z.string().trim().max(500, '备注不超过 500 字'),
})

const emptyValues: CreatorInput = {
  nickname: '',
  tiktokUrl: '',
  followers: 0,
  region: 'US',
  cooperationStatus: 'pending',
  commissionRate: 0,
  owner: '董雨辰',
  isBizAvailable: false,
  cooperationPrice: 0,
  cooperationNotes: '',
}

export function CreatorFormDialog({
  open,
  onOpenChange,
  creator,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  creator: Creator | null
}) {
  const createCreator = useCreateCreator()
  const updateCreator = useUpdateCreator()
  const form = useForm<CreatorInput>({
    resolver: zodResolver(creatorSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    form.reset(
      creator
        ? {
            nickname: creator.nickname,
            tiktokUrl: creator.tiktokUrl,
            followers: creator.followers,
            region: creator.region,
            cooperationStatus: creator.cooperationStatus,
            commissionRate: creator.commissionRate,
            owner: creator.owner,
            isBizAvailable: creator.isBizAvailable,
            cooperationPrice: creator.cooperationPrice,
            cooperationNotes: creator.cooperationNotes,
          }
        : emptyValues
    )
  }, [creator, form, open])

  const submit = async (values: CreatorInput) => {
    if (creator)
      await updateCreator.mutateAsync({ id: creator.id, input: values })
    else await createCreator.mutateAsync(values)
    onOpenChange(false)
  }

  const pending = createCreator.isPending || updateCreator.isPending
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{creator ? '编辑达人' : '新增达人'}</DialogTitle>
          <DialogDescription>
            {creator
              ? '已预填当前资料，只修改需要更新的字段。'
              : '录入达人基础信息和当前合作状态。'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className='grid gap-4 sm:grid-cols-2'
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              control={form.control}
              name='nickname'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>达人昵称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='owner'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>对接人</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='tiktokUrl'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>TikTok 主页</FormLabel>
                  <FormControl>
                    <Input
                      type='url'
                      placeholder='https://www.tiktok.com/@creator'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='followers'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>粉丝量</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='commissionRate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>佣金比例（%）</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      max={100}
                      step='0.1'
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='region'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属地区</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
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
              name='cooperationStatus'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>合作状态</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cooperationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {cooperationStatusLabels[status]}
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
              name='isBizAvailable'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <div>
                    <FormLabel>可商务合作</FormLabel>
                    <p className='text-xs text-muted-foreground'>
                      标记后商务商单可选该达人
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label='可商务合作'
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='cooperationPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>合作报价（元/单）</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      value={field.value ? field.value / 100 : ''}
                      placeholder='留空表示待议'
                      onChange={(event) => {
                        const yuan = Number(event.target.value)
                        field.onChange(
                          Number.isFinite(yuan) ? Math.round(yuan * 100) : 0
                        )
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='cooperationNotes'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>商务合作备注</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder='如：含植入脚本、素材授权范围等'
                      {...field}
                    />
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
                {pending && <LoaderCircle className='size-4 animate-spin' />}
                {creator ? '保存修改' : '新增达人'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
