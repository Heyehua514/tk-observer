import { useMemo, useRef, useState } from 'react'
import { ExternalLink, Plus, Save, Star, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadStateError } from '@/components/shared/load-state-error'
import { PageHeader } from '@/components/shared/page-header'
import { useCreateIntelligenceItem } from './hooks/use-create-intelligence-item'
import { useIntelligenceItems, useUpdateIntelligenceItem } from './hooks/use-intelligence-items'
import {
  filterIntelligenceItems,
  intelligenceSourceTypes,
  intelligenceStatuses,
  parseIntelligenceCsv,
  validateIntelligenceDraft,
  type IntelligenceDraft,
  type IntelligenceItem,
} from './intelligence-model'

const workspaceOptions = [
  ['all', '全部工作台'], ['overview', '总览'], ['market', '市场'],
  ['business', '商务'], ['design', '设计'], ['editing', '剪辑'], ['operations', '运营'],
] as const
const statusLabels: Record<IntelligenceItem['status'], string> = {
  unread: '未读', read: '已读', saved: '已收藏', ignored: '已忽略', tasked: '已转任务',
}
const sourceLabels: Record<(typeof intelligenceSourceTypes)[number], string> = {
  official: '官方公告', rss: 'RSS', authorized: '授权数据源', public: '公开页面', manual: '人工录入', csv: 'CSV 导入',
}

const emptyDraft: IntelligenceDraft = {
  title: '', summary: '', sourceName: '', sourceType: 'manual', sourceUrl: '',
  capturedAt: new Date().toISOString().slice(0, 16), region: '', language: 'zh-CN',
  topic: '', heatScore: 0, confidence: 0.5, dedupeKey: '', workspaces: [],
}

export function IntelligencePage() {
  const [query, setQuery] = useState('')
  const [workspace, setWorkspace] = useState('all')
  const [status, setStatus] = useState<IntelligenceItem['status'] | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [taskItem, setTaskItem] = useState<IntelligenceItem | null>(null)
  const [draft, setDraft] = useState<IntelligenceDraft>(emptyDraft)
  const csvInput = useRef<HTMLInputElement>(null)
  const items = useIntelligenceItems({ query, workspace, status })
  const createItem = useCreateIntelligenceItem()
  const updateItem = useUpdateIntelligenceItem()
  const visible = useMemo(
    () => filterIntelligenceItems(items.data || [], { query, workspace, status }),
    [items.data, query, workspace, status]
  )

  const submit = async () => {
    const errors = validateIntelligenceDraft(draft)
    if (errors.length) return toast.error(errors[0])
    try {
      await createItem.mutateAsync(draft)
      setDraft(emptyDraft)
      setOpen(false)
      toast.success('情报已保存')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '情报保存失败')
    }
  }

  const setItemStatus = async (item: IntelligenceItem, next: IntelligenceItem['status']) => {
    try {
      await updateItem.mutateAsync({ id: item.id, status: next })
      toast.success(`已标记为${statusLabels[next]}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '状态更新失败')
    }
  }

  const importCsv = async (file: File) => {
    const result = parseIntelligenceCsv(await file.text())
    if (result.errors.length) return toast.error(result.errors.slice(0, 2).join('；'))
    try {
      for (const row of result.rows) {
        await createItem.mutateAsync({ ...emptyDraft, ...row })
      }
      toast.success(`已导入 ${result.rows.length} 条情报`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV 导入失败')
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='每日情报中心'
        description='汇总公开、授权或人工确认的信息。平台实时抓取和自动执行暂未启用。'
        action={<div className='flex gap-2'><input ref={csvInput} className='hidden' type='file' accept='.csv,text/csv' aria-label='选择情报 CSV' onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = '' }} /><Button variant='outline' onClick={() => csvInput.current?.click()}>导入 CSV</Button><Button onClick={() => setOpen(true)}><Plus className='size-4' />新增情报</Button></div>}
      />
      <div className='grid gap-3 md:grid-cols-[1fr_auto_auto]'>
        <Input aria-label='搜索情报' placeholder='搜索标题、来源或主题' value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label='筛选工作台' className='h-9 rounded-md border bg-background px-3 text-sm' value={workspace} onChange={(event) => setWorkspace(event.target.value)}>
          {workspaceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label='筛选状态' className='h-9 rounded-md border bg-background px-3 text-sm' value={status} onChange={(event) => setStatus(event.target.value as IntelligenceItem['status'] | 'all')}>
          <option value='all'>全部状态</option>
          {intelligenceStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
        </select>
      </div>
      {items.isLoading ? <div className='min-h-40 animate-pulse rounded-xl border bg-muted/30' /> : items.isError ? <LoadStateError title='情报加载失败' description='请检查数据服务后重试。' onRetry={() => void items.refetch()} /> : visible.length === 0 ? <EmptyState title='还没有可用情报' description='先录入一条公开或授权来源的信息，团队就能按工作台筛选使用。' action={<Button onClick={() => setOpen(true)}><Plus className='size-4' />新增第一条</Button>} /> : <div className='grid gap-4 lg:grid-cols-2'>
        {visible.map((item) => <Card key={item.id} className='overflow-hidden'><CardContent className='space-y-4 p-5'>
          <div className='flex items-start justify-between gap-3'><div><div className='mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground'><span>{sourceLabels[item.sourceType]}</span><span>·</span><span>{item.sourceName}</span><span>·</span><span>{statusLabels[item.status]}</span></div><h2 className='text-lg font-semibold'>{item.title}</h2></div><span className='rounded-md border px-2 py-1 text-xs'>可信度 {Math.round(item.confidence * 100)}%</span></div>
          <p className='text-sm text-muted-foreground'>{item.summary || '暂无摘要'}</p>
          <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'><span>热度 {item.heatScore}</span><span>采集于 {new Date(item.capturedAt).toLocaleString('zh-CN')}</span>{item.topic && <span>主题：{item.topic}</span>}</div>
          <div className='flex flex-wrap gap-2'><Button size='sm' variant='outline' onClick={() => void setItemStatus(item, item.status === 'unread' ? 'read' : 'unread')}>{item.status === 'unread' ? <Eye className='size-4' /> : <EyeOff className='size-4' />}{item.status === 'unread' ? '标记已读' : '标记未读'}</Button><Button size='sm' variant='outline' onClick={() => void setItemStatus(item, item.status === 'saved' ? 'read' : 'saved')}><Star className='size-4' />{item.status === 'saved' ? '取消收藏' : '收藏'}</Button><Button size='sm' variant='outline' onClick={() => setTaskItem(item)}><Save className='size-4' />转为任务</Button><Button size='icon' variant='ghost' asChild><a href={item.sourceUrl} target='_blank' rel='noopener noreferrer' aria-label='打开原文'><ExternalLink className='size-4' /></a></Button></div>
        </CardContent></Card>)}
      </div>}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'><DialogHeader><DialogTitle>新增情报</DialogTitle><DialogDescription>只录入公开、授权或人工确认的来源；链接不会被系统自动抓取。</DialogDescription></DialogHeader><div className='grid gap-4 sm:grid-cols-2'><label className='space-y-1 text-sm sm:col-span-2'>标题<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label className='space-y-1 text-sm'>来源名称<Input value={draft.sourceName} onChange={(event) => setDraft({ ...draft, sourceName: event.target.value })} /></label><label className='space-y-1 text-sm'>来源类型<select className='mt-1 h-9 w-full rounded-md border bg-background px-3' value={draft.sourceType} onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as IntelligenceDraft['sourceType'] })}>{intelligenceSourceTypes.map((value) => <option key={value} value={value}>{sourceLabels[value]}</option>)}</select></label><label className='space-y-1 text-sm sm:col-span-2'>原文链接<Input type='url' value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} /></label><label className='space-y-1 text-sm sm:col-span-2'>摘要<Textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label><label className='space-y-1 text-sm'>采集时间<Input type='datetime-local' value={draft.capturedAt} onChange={(event) => setDraft({ ...draft, capturedAt: event.target.value })} /></label><label className='space-y-1 text-sm'>去重键<Input value={draft.dedupeKey} onChange={(event) => setDraft({ ...draft, dedupeKey: event.target.value })} /></label><label className='space-y-1 text-sm'>主题<Input value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} /></label><label className='space-y-1 text-sm'>地区<Input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} /></label></div><DialogFooter><Button variant='outline' onClick={() => setOpen(false)}>取消</Button><Button onClick={() => void submit()} disabled={createItem.isPending}><Save className='size-4' />保存情报</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(taskItem)} onOpenChange={(next) => !next && setTaskItem(null)}><DialogContent><DialogHeader><DialogTitle>转为任务</DialogTitle><DialogDescription>当前版本只记录转任务意图，不会自动创建业务任务。</DialogDescription></DialogHeader><p className='rounded-md border bg-muted/30 p-3 text-sm'>{taskItem?.title}</p><DialogFooter><Button variant='outline' onClick={() => setTaskItem(null)}>取消</Button><Button onClick={() => { setTaskItem(null); toast.success('已记录转任务意图，待确认后接入任务创建') }}>确认记录</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
