/** 市场资源库工作台：market 和 boss 可管理模板、物料与活动财务。 */
import { useMemo, useState } from 'react'
import { Download, FileText, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import {
  applyTemplate,
  downloadText,
  financesToCsv,
  financesToMarkdown,
} from './resource-utils'
import { marketResourceEmptyTitles } from './resource-empty-copy'
import type {
  FinanceCategory,
  FinanceType,
  MaterialStatus,
  MaterialType,
  TemplateEventType,
  TemplateType,
} from './types'
import {
  useEventFinances,
  useEventMaterials,
  useEventTemplates,
  useMarkTemplateUsed,
  useResourceEvents,
  useSaveFinance,
  useSaveMaterial,
  useSaveTemplate,
} from './use-market-resources'
import { financeYuanInput, formatFinanceCny } from './finance-format'

const templateTypeLabels: Record<TemplateType, string> = {
  invitation: '邀约文案',
  external_copy: '对外话术',
  poster_copy: '海报文案',
  review_report: '复盘报告',
  sop: '流程 SOP',
}
const materialTypeLabels: Record<MaterialType, string> = {
  key_visual: '主 KV',
  poster: '海报',
  invitation: '邀约函',
  check_in: '签到表',
  table_card: '桌牌',
  agenda: '流程单',
  thank_you: '感谢信',
}
const materialStatusLabels: Record<MaterialStatus, string> = {
  designing: '设计中',
  pending_review: '待审核',
  confirmed: '已确认',
  printed: '已印制',
}
const financeCategoryLabels: Record<FinanceCategory, string> = {
  sponsorship_income: '赞助收入',
  ticket_income: '票务收入',
  venue: '场地费',
  setup: '布置费',
  catering: '餐饮费',
  printing: '物料印刷',
  travel: '嘉宾差旅',
  other: '其他',
}

const NativeSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className='h-9 w-full rounded-md border bg-background px-3 text-sm'
  />
)

function TemplatesPanel() {
  const templates = useEventTemplates()
  const events = useResourceEvents()
  const save = useSaveTemplate()
  const markUsed = useMarkTemplateUsed()
  const [selectedId, setSelectedId] = useState('')
  const [eventId, setEventId] = useState('')
  const [draft, setDraft] = useState({
    name: '',
    type: 'invitation' as TemplateType,
    eventType: 'general' as TemplateEventType,
    content: '',
    tags: '',
  })
  const selected = templates.data?.find((item) => item.id === selectedId)
  const event = events.data?.find((item) => item.id === eventId)
  const preview = selected
    ? applyTemplate(selected.content, {
        活动名称: event?.name || '{{活动名称}}',
        活动城市: event?.city || '{{活动城市}}',
        城市: event?.city || '{{城市}}',
        活动日期: event?.date || '{{活动日期}}',
        活动主题: event?.theme || '{{活动主题}}',
      })
    : ''
  return (
    <div className='space-y-4'>
      <div className='grid gap-2 border-b pb-4 lg:grid-cols-5'>
        <Input
          placeholder='模板名称'
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <NativeSelect
          value={draft.type}
          onChange={(e) =>
            setDraft({ ...draft, type: e.target.value as TemplateType })
          }
        >
          {Object.entries(templateTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Input
          placeholder='标签，逗号分隔'
          value={draft.tags}
          onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
        />
        <Input
          placeholder='模板正文，支持 {{活动名称}}'
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
        <Button
          disabled={!draft.name || !draft.content || save.isPending}
          onClick={() =>
            void save
              .mutateAsync(draft)
              .then(() =>
                setDraft({ ...draft, name: '', content: '', tags: '' })
              )
          }
        >
          <Plus className='size-4' />
          新增模板
        </Button>
      </div>
      <div className='grid min-h-80 gap-4 lg:grid-cols-[320px_1fr]'>
        <div className='space-y-2'>
          {templates.data?.map((template) => (
            <button
              key={template.id}
              className='w-full rounded-md border p-3 text-left hover:bg-muted'
              onClick={() => setSelectedId(template.id)}
            >
              <div className='font-medium'>{template.name}</div>
              <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                <Badge variant='outline'>
                  {templateTypeLabels[template.type]}
                </Badge>
                使用 {template.usageCount} 次
              </div>
            </button>
          ))}
          {!templates.data?.length && (
            <EmptyState
              title={marketResourceEmptyTitles.templates}
              description='先沉淀一条可重复套用的活动文案。'
            />
          )}
        </div>
        <div className='space-y-3 rounded-md border p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h3 className='font-medium'>模板预览</h3>
            <div className='flex gap-2'>
              <NativeSelect
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value=''>选择套用活动</option>
                {events.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect>
              <Button
                variant='outline'
                disabled={!selected || !event}
                onClick={() => {
                  if (!selected) return
                  void navigator.clipboard.writeText(preview)
                  void markUsed.mutateAsync({
                    id: selected.id,
                    usageCount: selected.usageCount,
                  })
                }}
              >
                套用并复制
              </Button>
            </div>
          </div>
          <div className='min-h-56 rounded-md bg-muted p-4 text-sm leading-7 whitespace-pre-wrap'>
            {preview || '选择左侧模板后在此预览。'}
          </div>
        </div>
      </div>
    </div>
  )
}

function MaterialsPanel({ eventId }: { eventId?: string }) {
  const materials = useEventMaterials(eventId)
  const events = useResourceEvents()
  const save = useSaveMaterial()
  const [file, setFile] = useState<File>()
  const [draft, setDraft] = useState({
    eventId: eventId || '',
    name: '',
    type: 'key_visual' as MaterialType,
    status: 'designing' as MaterialStatus,
    notes: '',
  })
  return (
    <div className='space-y-4'>
      <div className='grid gap-2 border-b pb-4 lg:grid-cols-6'>
        <NativeSelect
          value={draft.eventId}
          onChange={(e) => setDraft({ ...draft, eventId: e.target.value })}
        >
          <option value=''>通用物料</option>
          {events.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <Input
          placeholder='物料名称'
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <NativeSelect
          value={draft.type}
          onChange={(e) =>
            setDraft({ ...draft, type: e.target.value as MaterialType })
          }
        >
          {Object.entries(materialTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Input type='file' onChange={(e) => setFile(e.target.files?.[0])} />
        <Input
          placeholder='备注'
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
        <Button
          disabled={!draft.name || save.isPending}
          onClick={() =>
            void save
              .mutateAsync({ ...draft, file })
              .then(() => setDraft({ ...draft, name: '', notes: '' }))
          }
        >
          <Plus className='size-4' />
          新增物料
        </Button>
      </div>
      {materials.data?.length ? (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {materials.data.map((item) => (
            <div key={item.id} className='rounded-md border p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <div className='font-medium'>{item.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {item.eventName || '通用物料'}
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === 'confirmed' || item.status === 'printed'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {materialStatusLabels[item.status]}
                </Badge>
              </div>
              <div className='mt-3 text-sm'>
                {materialTypeLabels[item.type]}
              </div>
              {item.file && (
                <div className='mt-2'>
                  <a
                    href={item.file}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
                  >
                    <FileText className='size-3.5' />
                    预览文件
                  </a>
                </div>
              )}
              {item.notes && (
                <div className='mt-1 text-sm text-muted-foreground'>
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={marketResourceEmptyTitles.materials}
          description='上传主 KV、海报、流程单等活动文件。'
        />
      )}
    </div>
  )
}

function FinancesPanel({ eventId }: { eventId?: string }) {
  const finances = useEventFinances(eventId)
  const events = useResourceEvents()
  const save = useSaveFinance()
  const [draft, setDraft] = useState({
    eventId: eventId || '',
    category: 'sponsorship_income' as FinanceCategory,
    type: 'income' as FinanceType,
    amount: '',
    description: '',
    paidBy: '',
    paidAt: '',
    receipt: undefined as File | undefined,
  })
  const totals = useMemo(() => {
    const rows = finances.data || []
    const income = rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.amount, 0)
    const expense = rows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0)
    return { income, expense, profit: income - expense }
  }, [finances.data])
  const exportFile = (format: 'csv' | 'md') => {
    const rows = finances.data || []
    downloadText(
      `event-finances.${format}`,
      format === 'csv' ? financesToCsv(rows) : financesToMarkdown(rows),
      format === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'text/markdown;charset=utf-8'
    )
  }
  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='border-l-4 border-emerald-500 px-3'>
          <div className='text-xs text-muted-foreground'>收入总计</div>
          <div className='text-xl font-semibold'>
            {formatFinanceCny(totals.income)}
          </div>
        </div>
        <div className='border-l-4 border-rose-500 px-3'>
          <div className='text-xs text-muted-foreground'>支出总计</div>
          <div className='text-xl font-semibold'>
            {formatFinanceCny(totals.expense)}
          </div>
        </div>
        <div className='border-l-4 border-primary px-3'>
          <div className='text-xs text-muted-foreground'>利润</div>
          <div className='text-xl font-semibold'>
            {formatFinanceCny(totals.profit)}
          </div>
        </div>
      </div>
      <div className='grid gap-2 border-y py-4 lg:grid-cols-7'>
        <NativeSelect
          value={draft.eventId}
          onChange={(e) => setDraft({ ...draft, eventId: e.target.value })}
        >
          <option value=''>选择活动</option>
          {events.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={draft.type}
          onChange={(e) =>
            setDraft({ ...draft, type: e.target.value as FinanceType })
          }
        >
          <option value='income'>收入</option>
          <option value='expense'>支出</option>
        </NativeSelect>
        <NativeSelect
          value={draft.category}
          onChange={(e) =>
            setDraft({ ...draft, category: e.target.value as FinanceCategory })
          }
        >
          {Object.entries(financeCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Input
          type='number'
          min={0}
          step='0.01'
          placeholder='金额（人民币/元）'
          value={draft.amount}
          onChange={(e) =>
            setDraft({ ...draft, amount: e.target.value })
          }
        />
        <Input
          placeholder='说明'
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <Input
          type='date'
          value={draft.paidAt}
          onChange={(e) => setDraft({ ...draft, paidAt: e.target.value })}
        />
        <Input
          type='file'
          accept='image/*,application/pdf'
          onChange={(e) =>
            setDraft({ ...draft, receipt: e.target.files?.[0] })
          }
        />
        <Button
          disabled={
            !draft.eventId ||
            !draft.description ||
            financeYuanInput(draft.amount) === null ||
            save.isPending
          }
          onClick={() =>
            void save
              .mutateAsync({
                ...draft,
                amount: financeYuanInput(draft.amount) || 0,
              })
              .then(() =>
                setDraft({
                  ...draft,
                  amount: '',
                  description: '',
                  receipt: undefined,
                })
              )
          }
        >
          <Plus className='size-4' />
          新增明细
        </Button>
      </div>
      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={() => exportFile('csv')}>
          <Download className='size-4' />
          CSV
        </Button>
        <Button variant='outline' onClick={() => exportFile('md')}>
          <FileText className='size-4' />
          Markdown
        </Button>
      </div>
      {finances.data?.length ? (
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>活动</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>凭证</TableHead>
                <TableHead>日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.eventName}</TableCell>
                  <TableCell>{financeCategoryLabels[row.category]}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {row.type === 'income' ? '收入' : '支出'}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>
                    {row.receipt ? (
                      <a
                        href={row.receipt}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
                      >
                        <FileText className='size-3.5' />
                        查看
                      </a>
                    ) : (
                      <span className='text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell>{row.paidAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={marketResourceEmptyTitles.finances}
          description='选择活动并录入第一笔收入或支出。'
        />
      )}
    </div>
  )
}

export function MarketResourcesWorkbench({ eventId }: { eventId?: string }) {
  return (
    <Tabs defaultValue='templates' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='templates'>文案模板</TabsTrigger>
        <TabsTrigger value='materials'>物料管理</TabsTrigger>
        <TabsTrigger value='finances'>财务明细</TabsTrigger>
      </TabsList>
      <TabsContent value='templates'>
        <TemplatesPanel />
      </TabsContent>
      <TabsContent value='materials'>
        <MaterialsPanel eventId={eventId} />
      </TabsContent>
      <TabsContent value='finances'>
        <FinancesPanel eventId={eventId} />
      </TabsContent>
    </Tabs>
  )
}
