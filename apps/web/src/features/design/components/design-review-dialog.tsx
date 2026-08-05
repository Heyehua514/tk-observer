/**
 * 设计稿审批弹窗。
 * 路由：/design；权限：boss；驳回时理由必填。
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
import { Textarea } from '@/components/ui/textarea'
import { useUpdateDesignAssetStatus } from '../hooks/use-update-design-asset-status'
import type { DesignAsset } from '../types'

const schema = z.object({
  reason: z.string().trim().min(1, '驳回时必须填写理由').max(1000),
})
type Values = z.infer<typeof schema>

export function DesignReviewDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: DesignAsset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateStatus = useUpdateDesignAssetStatus()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })
  useEffect(() => {
    if (!open) form.reset({ reason: '' })
  }, [form, open])

  const approve = async () => {
    if (!asset) return
    await updateStatus.mutateAsync({ id: asset.id, status: 'approved' })
    onOpenChange(false)
  }
  const reject = async (values: Values) => {
    if (!asset) return
    await updateStatus.mutateAsync({
      id: asset.id,
      status: 'rejected',
      reason: values.reason,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>审核设计稿</DialogTitle>
          <DialogDescription>{asset?.fileName || '设计稿'}</DialogDescription>
        </DialogHeader>
        {asset?.fileUrl && (
          <img
            src={asset.fileUrl}
            alt={asset.fileName}
            className='max-h-64 w-full rounded-lg border object-contain'
          />
        )}
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(reject)}>
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>驳回理由</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='只有驳回时需要填写'
                      className='min-h-24 resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='submit'
                variant='outline'
                disabled={updateStatus.isPending}
              >
                驳回
              </Button>
              <Button
                type='button'
                onClick={() => void approve()}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending && (
                  <LoaderCircle className='size-4 animate-spin' />
                )}
                通过
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
