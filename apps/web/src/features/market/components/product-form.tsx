/**
 * 市场选品库新增/编辑弹窗（C3）。
 * 注意：表单需要的字段通过 props 传入。
 * 金额用元输入，入库换算为分；统一人民币/美元与毛利率口径。
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
  useCreateProduct,
  useUpdateProduct,
  type ProductInput,
} from '../hooks/use-product-crud'

const regions = ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG']
const statuses = ['draft', 'testing', 'active', 'paused']
const statusLabels: Record<string, string> = {
  draft: '草稿',
  testing: '测试中',
  active: '上架',
  paused: '暂停',
}

const schema = z.object({
  name: z.string().trim().min(1, '请输入商品名称').max(160),
  category: z.string().trim().min(1, '请输入类目').max(80),
  priceYuan: z.string().min(1, '请输入售价'),
  costYuan: z.string().min(1, '请输入成本'),
  currency: z.enum(['CNY', 'USD']),
  region: z.string().min(1),
  status: z.enum(['draft', 'testing', 'active', 'paused']),
})
type FormValues = z.infer<typeof schema>

export type ProductFormData = {
  id: string
  name: string
  category: string
  priceMinor: number
  costMinor: number
  currency: string
  status: string
  region: string
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductFormData | null
}) {
  const create = useCreateProduct()
  const update = useUpdateProduct()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: '',
      priceYuan: '',
      costYuan: '',
      currency: 'CNY',
      region: 'US',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: product?.name ?? '',
      category: product?.category ?? '',
      priceYuan: product ? (product.priceMinor / 100).toString() : '',
      costYuan: product ? (product.costMinor / 100).toString() : '',
      currency: (product?.currency as 'CNY' | 'USD') ?? 'CNY',
      region: product?.region ?? 'US',
      status: (product?.status as FormValues['status']) ?? 'draft',
    })
  }, [open, product, form])

  const submit = async (values: FormValues) => {
    const input: ProductInput = {
      name: values.name,
      category: values.category,
      priceYuan: values.priceYuan,
      costYuan: values.costYuan,
      currency: values.currency,
      region: values.region,
      status: values.status,
    }
    if (product) await update.mutateAsync({ id: product.id, input })
    else await create.mutateAsync(input)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={product?.id ?? 'new'} className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{product ? '编辑商品' : '新增商品'}</DialogTitle>
          <DialogDescription>
            登记名称、类目、售价/成本（元）、币种、目标站点和状态。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品名称</FormLabel>
                  <FormControl>
                    <Input placeholder='例如：便携制冰机' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类目</FormLabel>
                  <FormControl>
                    <Input placeholder='例如：家居 / 厨房' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='priceYuan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>售价（元）</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} step='0.01' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='costYuan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>成本（元）</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} step='0.01' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>币种</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='CNY'>人民币</SelectItem>
                        <SelectItem value='USD'>美元</SelectItem>
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
                        {regions.map((r) => (
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
