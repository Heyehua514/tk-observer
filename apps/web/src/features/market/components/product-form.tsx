/**
 * 市场选品库新增/编辑弹窗（C3）。
 * 金额用元输入，入库换算为分；全链路支持多币种汇率换算与毛利率实时核算闭环。
 */
import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Calculator, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  calculateProductMargin,
  getBenchmarkExchangeRate,
  REGION_CURRENCY_MAP,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
} from './product-model'

const regions = ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG']
const statuses = ['draft', 'testing', 'active', 'paused'] as const
const statusLabels: Record<string, string> = {
  draft: '草稿',
  testing: '测试中',
  active: '上架',
  paused: '暂停',
}

const currencyLabels: Record<string, string> = {
  USD: 'USD 美元 ($)',
  CNY: 'CNY 人民币 (¥)',
  GBP: 'GBP 英镑 (£)',
  EUR: 'EUR 欧元 (€)',
  SGD: 'SGD 新币 (S$)',
  MYR: 'MYR 马币 (RM)',
  THB: 'THB 泰铢 (฿)',
  PHP: 'PHP 比索 (₱)',
  IDR: 'IDR 印尼盾 (Rp)',
  VND: 'VND 越南盾 (₫)',
}

const schema = z.object({
  name: z.string().trim().min(1, '请输入商品名称').max(160),
  category: z.string().trim().min(1, '请输入类目').max(80),
  priceYuan: z.string().min(1, '请输入售价'),
  costYuan: z.string().min(1, '请输入成本'),
  currency: z.string().min(1, '请选择销售币种'),
  costCurrency: z.string().min(1, '请选择采购币种'),
  exchangeRate: z.string().min(1, '请输入汇率'),
  region: z.string().min(1, '请选择目标站点'),
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
  costCurrency?: string
  exchangeRate?: number
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
      currency: 'USD',
      costCurrency: 'CNY',
      exchangeRate: '7.20',
      region: 'US',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (!open) return
    const cur = product?.currency || 'USD'
    const rate = product?.exchangeRate ?? getBenchmarkExchangeRate(cur)
    form.reset({
      name: product?.name ?? '',
      category: product?.category ?? '',
      priceYuan: product ? (product.priceMinor / 100).toString() : '',
      costYuan: product ? (product.costMinor / 100).toString() : '',
      currency: cur,
      costCurrency: product?.costCurrency ?? 'CNY',
      exchangeRate: rate.toString(),
      region: product?.region ?? 'US',
      status: (product?.status as FormValues['status']) ?? 'draft',
    })
  }, [open, product, form])

  // 监听表单数值进行实时毛利核算
  const watchedPrice = form.watch('priceYuan')
  const watchedCost = form.watch('costYuan')
  const watchedCurrency = form.watch('currency')
  const watchedCostCurrency = form.watch('costCurrency')
  const watchedRate = form.watch('exchangeRate')

  const parsedPriceMinor = Math.round(Number(watchedPrice || 0) * 100)
  const parsedCostMinor = Math.round(Number(watchedCost || 0) * 100)
  const parsedRate = Number(watchedRate || 1.0)

  const marginCalculation = calculateProductMargin({
    priceMinor: parsedPriceMinor,
    currency: watchedCurrency,
    costMinor: parsedCostMinor,
    costCurrency: watchedCostCurrency,
    exchangeRate: parsedRate > 0 ? parsedRate : 1.0,
  })

  // 区域联动自动匹配币种与汇率
  const handleRegionChange = (newRegion: string) => {
    form.setValue('region', newRegion)
    const suggestedCurrency = REGION_CURRENCY_MAP[newRegion]
    if (suggestedCurrency) {
      form.setValue('currency', suggestedCurrency)
      form.setValue('exchangeRate', getBenchmarkExchangeRate(suggestedCurrency).toString())
    }
  }

  // 币种变化联动汇率建议
  const handleCurrencyChange = (newCurrency: string) => {
    form.setValue('currency', newCurrency)
    form.setValue('exchangeRate', getBenchmarkExchangeRate(newCurrency).toString())
  }

  const submit = async (values: FormValues) => {
    const input: ProductInput = {
      name: values.name,
      category: values.category,
      priceYuan: values.priceYuan,
      costYuan: values.costYuan,
      currency: values.currency,
      costCurrency: values.costCurrency,
      exchangeRate: Number(values.exchangeRate || 1.0),
      region: values.region,
      status: values.status,
    }
    if (product) await update.mutateAsync({ id: product.id, input })
    else await create.mutateAsync(input)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={product?.id ?? 'new'} className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{product ? '编辑商品' : '新增选品'}</DialogTitle>
          <DialogDescription>
            录入选品名称、类目、销售定价、供应链采购成本与适用汇率，自动闭环毛利核算。
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
                    <Input placeholder='例如：便携户外水杯 / 氛围发光音箱' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>类目</FormLabel>
                    <FormControl>
                      <Input placeholder='例如：家居 / 美妆 / 数码' {...field} />
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
                    <FormLabel>目标市场站点</FormLabel>
                    <Select value={field.value} onValueChange={handleRegionChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r} 站点
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 定价与成本录入 */}
            <div className='rounded-lg border bg-muted/30 p-3.5 space-y-3'>
              <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
                <Calculator className='size-3.5' />
                <span>价格、成本与汇率换算</span>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='priceYuan'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>
                        销售定价 ({CURRENCY_SYMBOLS[watchedCurrency] || watchedCurrency})
                      </FormLabel>
                      <FormControl>
                        <Input type='number' min={0} step='0.01' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='currency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>销售币种</FormLabel>
                      <Select value={field.value} onValueChange={handleCurrencyChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {currencyLabels[c] || c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='costYuan'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>
                        采购成本 ({CURRENCY_SYMBOLS[watchedCostCurrency] || watchedCostCurrency})
                      </FormLabel>
                      <FormControl>
                        <Input type='number' min={0} step='0.01' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='costCurrency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>成本币种</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {currencyLabels[c] || c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='exchangeRate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>
                        销售币兑人民币汇率 (1 {watchedCurrency} = ? CNY)
                      </FormLabel>
                      <FormControl>
                        <Input type='number' min={0.0001} step='0.0001' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>选品状态</FormLabel>
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

              {/* 实时毛利估算面板 */}
              <div className='rounded-md border border-dashed bg-background/80 p-3 space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-medium text-muted-foreground'>预估实时毛利与毛利率</span>
                  <Badge
                    variant={
                      marginCalculation.marginLevel === 'loss'
                        ? 'destructive'
                        : marginCalculation.marginLevel === 'low'
                        ? 'secondary'
                        : 'default'
                    }
                    className='text-[11px] font-mono'
                  >
                    {marginCalculation.marginLevel === 'high' && <TrendingUp className='mr-1 size-3' />}
                    {marginCalculation.marginLevel === 'loss' && <AlertTriangle className='mr-1 size-3' />}
                    {marginCalculation.marginRate}% 毛利率
                  </Badge>
                </div>
                <div className='grid grid-cols-3 gap-2 text-xs pt-1'>
                  <div>
                    <span className='text-muted-foreground'>折合销售额:</span>{' '}
                    <span className='font-semibold'>¥{(marginCalculation.priceInCnyMinor / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>折合总成本:</span>{' '}
                    <span className='font-semibold'>¥{(marginCalculation.costInCnyMinor / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>单件预估毛利:</span>{' '}
                    <span
                      className={`font-semibold ${
                        marginCalculation.profitInCnyMinor < 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      ¥{(marginCalculation.profitInCnyMinor / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
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
