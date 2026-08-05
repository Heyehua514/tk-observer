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
})

const emptyValues: CreatorInput = {
  nickname: '',
  tiktokUrl: '',
  followers: 0,
  region: 'US',
  cooperationStatus: 'pending',
  commissionRate: 0,
  owner: '董雨辰',
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
