/** GMV 录入弹窗：选日期 + 填金额（元），同一日期覆盖旧值。 */
import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
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
import { DatePicker } from '@/components/date-picker'
import { createGmvMetric } from './gmv-mutation'

const gmvSchema = z.object({
  date: z.date({ message: '请选择日期' }),
  amountYuan: z
    .string()
    .min(1, '请输入金额')
    .refine((value) => {
      const n = Number(value)
      return Number.isFinite(n) && n >= 0
    }, '请输入有效金额'),
})

type GmvValues = z.infer<typeof gmvSchema>

const toVehicle = (date: Date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function GmvEntryDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<GmvValues>({
    resolver: zodResolver(gmvSchema),
    defaultValues: { date: undefined as unknown as Date, amountYuan: '' },
  })
  const amountYuan = useWatch({ control: form.control, name: 'amountYuan' })
  const mutation = useMutation({
    mutationFn: createGmvMetric,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['overview-dashboard'] })
      toast.success('GMV 已录入')
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error('录入失败，请检查网络后重试'),
  })

  const submit = (values: GmvValues) => {
    mutation.mutate({
      metricDate: toVehicle(values.date),
      amountMinor: Math.round(Number(values.amountYuan) * 100),
      currency: 'CNY',
      region: 'US',
    })
  }

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        <Plus className='size-4' />
        录入 GMV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>录入经营数据</DialogTitle>
            <DialogDescription>
              选择日期并填写当日成交金额（人民币元）。同一日期重复录入会覆盖旧值。
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日期</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder='选择日期'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='amountYuan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>成交金额（元）</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        step='0.01'
                        inputMode='decimal'
                        placeholder='例如 50000.00'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {amountYuan ? (
                <p className='text-xs text-muted-foreground'>
                  预览：{formatMoney(Math.round(Number(amountYuan) * 100))}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  取消
                </Button>
                <Button type='submit' disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <LoaderCircle className='size-4 animate-spin' />
                  )}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
