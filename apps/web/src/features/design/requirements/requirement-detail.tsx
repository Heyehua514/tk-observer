/** 设计需求详情：基础信息、视觉参考和交付记录子 Tab。 */
import { useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { findMaterialsForRequirement } from '@/features/market/resources/material-design-link'
import { useEventMaterials } from '@/features/market/resources/use-market-resources'
import { requirementStatusLabels } from './requirement-labels'
import { nextRequirementStatuses } from './requirement-rules'
import type { DesignRequirement } from './types'
import {
  useApprovedDesignAssets,
  useCreateDesignDeliverable,
  useCreateDesignReference,
  useRequirementRelations,
  useUpdateRequirementStatus,
} from './use-design-requirements'

const materialStatusLabels: Record<string, string> = {
  designing: '设计中',
  pending_review: '待审核',
  confirmed: '已确认',
  printed: '已印制',
}

export function RequirementDetail({
  requirement,
  open,
  onOpenChange,
}: {
  requirement: DesignRequirement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const role = useAuthStore((state) => state.user?.role)
  const isDesigner = role === 'design'
  const relations = useRequirementRelations(requirement?.id || '', isDesigner)
  const updateStatus = useUpdateRequirementStatus()
  const addReference = useCreateDesignReference()
  const addDeliverable = useCreateDesignDeliverable()
  const assets = useApprovedDesignAssets(isDesigner)
  const materials = useEventMaterials()
  const [asset, setAsset] = useState('')
  if (!requirement) return null
  const linkedMaterials = findMaterialsForRequirement(
    requirement,
    materials.data || []
  )
  const nextStatuses = nextRequirementStatuses(requirement.status).filter(
    (status) => (isDesigner ? status !== 'revised' : status === 'revised')
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{requirement.title}</DialogTitle>
        </DialogHeader>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge>{requirementStatusLabels[requirement.status]}</Badge>
          <Badge variant='outline'>{requirement.priority}优先级</Badge>
          <span className='text-sm text-muted-foreground'>
            截止 {requirement.dueDate.slice(0, 10)}
          </span>
          {nextStatuses.map((status) => (
            <Button
              key={status}
              size='sm'
              variant='outline'
              onClick={() =>
                updateStatus.mutate({ id: requirement.id, status })
              }
            >
              {requirementStatusLabels[status]}
            </Button>
          ))}
        </div>
        <Tabs defaultValue='detail'>
          <TabsList>
            <TabsTrigger value='detail'>需求详情</TabsTrigger>
            <TabsTrigger value='references'>视觉参考</TabsTrigger>
            <TabsTrigger value='deliverables'>交付记录</TabsTrigger>
            <TabsTrigger value='materials'>关联物料</TabsTrigger>
          </TabsList>
          <TabsContent
            value='detail'
            className='mt-4 grid gap-4 sm:grid-cols-2'
          >
            <Info label='画面尺寸' value={requirement.targetSize} />
            <Info label='使用场景' value={requirement.usageScene} />
            <Info label='交付格式' value={requirement.deliveryFormat} />
            <Info label='需求描述' value={requirement.description} wide />
            <Info label='完整文案' value={requirement.copyContent} wide />
          </TabsContent>
          <TabsContent value='references' className='mt-4 space-y-4'>
            {requirement.referenceUrls
              .split('\n')
              .filter(Boolean)
              .map((url) => (
                <a
                  className='flex items-center gap-2 text-sm text-primary hover:underline'
                  href={url}
                  target='_blank'
                  rel='noreferrer'
                  key={url}
                >
                  <ExternalLink className='size-4' />
                  {url}
                </a>
              ))}
            {relations.data?.references.map((item) => (
              <div className='rounded-lg border p-3' key={item.id}>
                <a
                  className='font-medium hover:underline'
                  href={item.imageUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  {item.source || item.imageUrl}
                </a>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {item.notes}
                </p>
              </div>
            ))}
            {isDesigner && (
              <form
                className='grid gap-3 rounded-lg border p-3 sm:grid-cols-2'
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  addReference.mutate(
                    {
                      requirement: requirement.id,
                      image_url: String(form.get('imageUrl') || ''),
                      source: String(form.get('source') || ''),
                      notes: String(form.get('notes') || ''),
                    },
                    { onSuccess: () => event.currentTarget.reset() }
                  )
                }}
              >
                <Field label='图片链接'>
                  <Input name='imageUrl' type='url' required />
                </Field>
                <Field label='来源'>
                  <Input name='source' />
                </Field>
                <div className='sm:col-span-2'>
                  <Field label='备注'>
                    <Textarea name='notes' />
                  </Field>
                </div>
                <Button type='submit' size='sm'>
                  <Plus className='size-4' />
                  添加参考
                </Button>
              </form>
            )}
          </TabsContent>
          <TabsContent value='deliverables' className='mt-4 space-y-4'>
            {relations.data?.deliverables.map((item) => (
              <div
                className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
                key={item.id}
              >
                <div>
                  <div className='font-medium'>{item.assetName}</div>
                  <div className='text-sm text-muted-foreground'>
                    {item.exportedSize} · {item.exportedFormat} ·{' '}
                    {item.deliveredAt.slice(0, 10)}
                  </div>
                </div>
                <Badge variant={item.checklistOk ? 'default' : 'destructive'}>
                  {item.checklistOk ? '检查通过' : '待检查'}
                </Badge>
              </div>
            ))}
            {isDesigner && (
              <form
                className='grid gap-3 rounded-lg border p-3 sm:grid-cols-2'
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  addDeliverable.mutate(
                    {
                      requirement: requirement.id,
                      asset,
                      exported_size: String(form.get('size') || ''),
                      exported_format: String(form.get('format') || ''),
                      checklist_ok: form.get('checklist') === 'on',
                      delivered_at: new Date().toISOString(),
                    },
                    {
                      onSuccess: () => {
                        event.currentTarget.reset()
                        setAsset('')
                      },
                    }
                  )
                }}
              >
                <Field label='已通过素材'>
                  <Select value={asset} onValueChange={setAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder='选择素材' />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.data?.map((item) => (
                        <SelectItem value={item.id} key={item.id}>
                          {String(item.file_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label='导出尺寸'>
                  <Input name='size' required />
                </Field>
                <Field label='导出格式'>
                  <Input name='format' required />
                </Field>
                <label className='flex items-center gap-2 text-sm'>
                  <input name='checklist' type='checkbox' required />
                  文案、排版、尺寸、清晰度检查通过
                </label>
                <Button type='submit' size='sm' disabled={!asset}>
                  <Plus className='size-4' />
                  添加交付
                </Button>
              </form>
            )}
          </TabsContent>
          <TabsContent value='materials' className='mt-4 space-y-3'>
            {linkedMaterials.map((item) => (
              <div
                className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
                key={item.id}
              >
                <div>
                  <div className='font-medium'>{item.name}</div>
                  <div className='text-sm text-muted-foreground'>
                    {item.eventName || '通用物料'}
                  </div>
                </div>
                <Badge variant='outline'>
                  {materialStatusLabels[item.status] || item.status}
                </Badge>
              </div>
            ))}
            {!linkedMaterials.length && (
              <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                还没有关联活动物料。市场侧物料备注写入 design:{requirement.id}{' '}
                或包含需求标题后会自动出现在这里。
              </div>
            )}
            <Button asChild variant='outline' size='sm'>
              <a href='/market'>打开市场物料库</a>
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function Info({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-sm whitespace-pre-wrap'>{value || '—'}</div>
    </div>
  )
}
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
