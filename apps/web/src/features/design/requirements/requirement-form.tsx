/** 设计需求提交表单；仅 boss/business 可创建。 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DesignPriority } from './types'
import { useCreateDesignRequirement } from './use-design-requirements'

export function RequirementForm({
  open,
  onOpenChange,
  requester,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requester: string
}) {
  const create = useCreateDesignRequirement()
  const [priority, setPriority] = useState<DesignPriority>('中')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>提交设计需求</DialogTitle>
        </DialogHeader>
        <form
          className='grid gap-4 sm:grid-cols-2'
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            create.mutate(
              {
                title: String(form.get('title') || ''),
                description: String(form.get('description') || ''),
                requester,
                targetSize: String(form.get('targetSize') || ''),
                usageScene: String(form.get('usageScene') || ''),
                copyContent: String(form.get('copyContent') || ''),
                deliveryFormat: String(form.get('deliveryFormat') || ''),
                referenceUrls: String(form.get('referenceUrls') || ''),
                priority,
                dueDate: String(form.get('dueDate') || ''),
              },
              { onSuccess: () => onOpenChange(false) }
            )
          }}
        >
          <Field label='需求标题'>
            <Input name='title' maxLength={200} required />
          </Field>
          <Field label='截止日期'>
            <Input name='dueDate' type='date' required />
          </Field>
          <Field label='画面尺寸'>
            <Input name='targetSize' placeholder='1080×1920' required />
          </Field>
          <Field label='使用场景'>
            <Input name='usageScene' placeholder='朋友圈海报' required />
          </Field>
          <Field label='交付格式'>
            <Input name='deliveryFormat' placeholder='PNG / PSD' required />
          </Field>
          <Field label='优先级'>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as DesignPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['高', '中', '低'].map((item) => (
                  <SelectItem value={item} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='需求描述' wide>
            <Textarea name='description' required />
          </Field>
          <Field label='完整文案' wide>
            <Textarea name='copyContent' required />
          </Field>
          <Field label='参考链接（每行一个）' wide>
            <Textarea name='referenceUrls' />
          </Field>
          <div className='flex justify-end sm:col-span-2'>
            <Button type='submit' disabled={create.isPending}>
              提交需求
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  wide,
  children,
}: {
  label: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-2 ${wide ? 'sm:col-span-2' : ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
