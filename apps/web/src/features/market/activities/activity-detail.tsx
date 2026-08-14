/** 市场活动详情六 Tab；权限：market、boss。 */
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  UsersRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import {
  downloadText,
  financesToCsv,
  financesToMarkdown,
  type EventFinance,
} from '../resources'
import { eventStatusLabels, eventTypeLabels } from '../constants'
import { calculateActivityMetrics } from './activity-metrics'
import { activityFinanceAmountInput } from './activity-finance'
import {
  useActivityDetail,
  useCreateActivityFinance,
  useUpdateActivityTask,
} from './use-activity-detail'

const money = (amount: number) =>
  `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

export function ActivityDetail({ eventId }: { eventId: string }) {
  const detail = useActivityDetail(eventId)
  const metrics = useMemo(
    () =>
      detail.data
        ? calculateActivityMetrics(
            detail.data.tasks,
            detail.data.registrations,
            detail.data.sponsorships,
            detail.data.finances
          )
        : null,
    [detail.data]
  )
  if (detail.isLoading)
    return (
      <div className='p-6 text-sm text-muted-foreground'>正在加载活动详情…</div>
    )
  if (detail.isError || !detail.data || !metrics)
    return (
      <EmptyState
        title='活动不存在或无权访问'
        description='请返回市场工作台重新选择活动。'
        action={
          <Button asChild>
            <Link to='/market' search={{ query: '' }}>
              返回市场工作台
            </Link>
          </Button>
        }
      />
    )
  const {
    event,
    phases,
    tasks,
    registrations,
    sponsorships,
    materials,
    finances,
  } = detail.data
  return (
    <div className='space-y-6'>
      <Button variant='ghost' asChild>
        <Link to='/market' search={{ query: '' }}>
          <ArrowLeft className='size-4' />
          返回市场工作台
        </Link>
      </Button>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>{event.name}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {event.theme || '未填写主题'} · {event.startDate} ·{' '}
            {event.locationCity}
          </p>
        </div>
        <div className='flex gap-2'>
          <Badge>{eventTypeLabels[event.type]}</Badge>
          <Badge variant='secondary'>{eventStatusLabels[event.status]}</Badge>
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-4'>
        <Metric
          icon={<ClipboardList />}
          label='任务进度'
          value={`${metrics.taskDone}/${metrics.taskTotal}`}
        />
        <Metric
          icon={<UsersRound />}
          label='已确认报名'
          value={`${metrics.confirmedRegistrations}/${event.targetAttendees || 0}`}
        />
        <Metric
          icon={<CircleDollarSign />}
          label='已签赞助'
          value={money(metrics.signedSponsorship)}
        />
        <Metric
          icon={<CheckCircle2 />}
          label='活动利润'
          value={money(metrics.profit)}
        />
      </div>
      <Tabs defaultValue='overview'>
        <TabsList className='flex h-auto flex-wrap'>
          <TabsTrigger value='overview'>活动概览</TabsTrigger>
          <TabsTrigger value='tasks'>任务看板</TabsTrigger>
          <TabsTrigger value='sponsorships'>招商跟进</TabsTrigger>
          <TabsTrigger value='registrations'>报名管理</TabsTrigger>
          <TabsTrigger value='finances'>财务复盘</TabsTrigger>
          <TabsTrigger value='progress'>进度总览</TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='mt-5'>
          <section className='space-y-3'>
            <h2 className='font-medium'>活动阶段</h2>
            {phases.length ? (
              phases.map((phase) => (
                <div key={phase.id} className='rounded-lg border p-3'>
                  <div className='flex justify-between text-sm'>
                    <span>{phase.name}</span>
                    <span>{phase.completionPct || 0}%</span>
                  </div>
                  <div className='mt-2 h-2 rounded-full bg-muted'>
                    <div
                      className='h-2 rounded-full bg-primary'
                      style={{ width: `${phase.completionPct || 0}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title='尚未配置阶段'
                description='后续可为活动建立 P0-P4 阶段和任务。'
              />
            )}
          </section>
        </TabsContent>
        <TabsContent value='tasks' className='mt-5'>
          <TaskBoard eventId={eventId} tasks={tasks} />
        </TabsContent>
        <TabsContent value='sponsorships' className='mt-5'>
          <RecordList items={sponsorships} empty='尚未录入招商意向' />
        </TabsContent>
        <TabsContent value='registrations' className='mt-5'>
          <RecordList items={registrations} empty='尚未有报名记录' />
        </TabsContent>
        <TabsContent value='finances' className='mt-5'>
          <FinancePanel
            eventId={eventId}
            finances={finances}
            metrics={metrics}
          />
        </TabsContent>
        <TabsContent value='progress' className='mt-5'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <ProgressBlock
              title='任务完成度'
              value={
                metrics.taskTotal ? metrics.taskDone / metrics.taskTotal : 0
              }
            />
            <ProgressBlock
              title='报名完成度'
              value={
                event.targetAttendees
                  ? metrics.confirmedRegistrations / event.targetAttendees
                  : 0
              }
            />
            <ProgressBlock
              title='招商目标完成度'
              value={
                event.targetSponsorship
                  ? metrics.signedSponsorship / event.targetSponsorship
                  : 0
              }
            />
            <ProgressBlock
              title='物料完成度'
              value={
                materials.length
                  ? materials.filter(
                      (item) =>
                        item.status === 'confirmed' || item.status === 'printed'
                    ).length / materials.length
                  : 0
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
function Metric({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='rounded-lg border p-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        {icon}
        {label}
      </div>
      <div className='mt-1 text-lg font-semibold'>{value}</div>
    </div>
  )
}
function ProgressBlock({ title, value }: { title: string; value: number }) {
  const pct = Math.min(Math.max(value * 100, 0), 100)
  return (
    <div className='rounded-lg border p-4'>
      <div className='flex justify-between text-sm'>
        <span>{title}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className='mt-3 h-2 rounded-full bg-muted'>
        <div
          className='h-2 rounded-full bg-primary'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
function RecordList({
  items,
  empty,
}: {
  items: Array<{
    id: string
    title?: string
    name?: string
    description?: string
    status?: string
    stage?: string
    amount?: number
    company?: string
    notes?: string
  }>
  empty: string
}) {
  if (!items.length)
    return (
      <EmptyState title={empty} description='数据写入后会在这里实时显示。' />
    )
  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='divide-y'>
        {items.map((item) => (
          <div
            key={item.id}
            className='flex flex-wrap items-center justify-between gap-2 p-3 text-sm'
          >
            <span className='font-medium'>
              {item.title ||
                item.name ||
                item.company ||
                item.description ||
                '未命名记录'}
            </span>
            <span className='text-muted-foreground'>
              {item.status ||
                item.stage ||
                item.notes ||
                (item.amount !== undefined ? money(item.amount) : '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskBoard({
  eventId,
  tasks,
}: {
  eventId: string
  tasks: Array<{ id: string; title?: string; status?: string; notes?: string }>
}) {
  const update = useUpdateActivityTask(eventId)
  const [dragged, setDragged] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()
  const columns = { todo: '待处理', in_progress: '进行中', done: '已完成' }
  if (!tasks.length)
    return (
      <EmptyState
        title='尚未配置活动任务'
        description='数据写入后会在这里显示看板。'
      />
    )
  return (
    <div className='grid gap-3 md:grid-cols-3'>
      {Object.entries(columns).map(([status, label]) => (
        <div
          key={status}
          className='min-h-48 rounded-lg border bg-muted/20 p-3'
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragged) void update.mutateAsync({ id: dragged, status })
          }}
        >
          <h3 className='mb-3 text-sm font-medium'>{label}</h3>
          <div className='space-y-2'>
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <motion.div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragged(task.id)}
                  onDragEnd={() => setDragged(null)}
                  animate={
                    dragged === task.id && !reduceMotion
                      ? {
                          scale: 1.02,
                          boxShadow: '0 16px 30px rgba(15,23,42,.16)',
                        }
                      : {
                          scale: 1,
                          boxShadow: '0 1px 2px rgba(15,23,42,.06)',
                        }
                  }
                  className='cursor-grab rounded-md border bg-background p-3 text-sm shadow-sm'
                >
                  <div className='font-medium'>
                    {task.title || '未命名任务'}
                  </div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {task.notes || '无备注'}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FinancePanel({
  eventId,
  finances,
  metrics,
}: {
  eventId: string
  finances: Array<{
    id: string
    type?: string
    amount?: number
    category?: string
    description?: string
    paidBy?: string
    paidAt?: string
  }>
  metrics: { income: number; expense: number; profit: number }
}) {
  const create = useCreateActivityFinance(eventId)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const exportRows: EventFinance[] = finances.map((item) => ({
    id: item.id,
    eventId,
    eventName: eventId,
    category: (item.category || 'other') as EventFinance['category'],
    type: (item.type || 'expense') as EventFinance['type'],
    amount: item.amount || 0,
    description: item.description || '',
    paidBy: item.paidBy || '',
    paidAt: item.paidAt || '',
    receipt: '',
  }))
  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <Metric label='收入' value={money(metrics.income)} />
        <Metric label='支出' value={money(metrics.expense)} />
        <Metric
          label='利润率'
          value={
            metrics.income
              ? `${((metrics.profit / metrics.income) * 100).toFixed(1)}%`
              : '0%'
          }
        />
      </div>
      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          onClick={() =>
            downloadText(
              `event-finances-${eventId}.csv`,
              financesToCsv(exportRows),
              'text/csv;charset=utf-8'
            )
          }
        >
          导出 CSV
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            downloadText(
              `event-finances-${eventId}.md`,
              financesToMarkdown(exportRows),
              'text/markdown;charset=utf-8'
            )
          }
        >
          导出 Markdown
        </Button>
      </div>
      <div className='grid gap-2 rounded-lg border p-4 sm:grid-cols-4'>
        <select
          className='h-9 rounded-md border bg-background px-2 text-sm'
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
        >
          <option value='expense'>支出</option>
          <option value='income'>收入</option>
        </select>
        <input
          className='h-9 rounded-md border bg-background px-3 text-sm'
          type='number'
          min='0'
          step='0.01'
          placeholder='金额（人民币/元）'
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <input
          className='h-9 rounded-md border bg-background px-3 text-sm'
          placeholder='明细说明'
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Button
          disabled={
            activityFinanceAmountInput(amount) === null ||
            !description ||
            create.isPending
          }
          onClick={() =>
            void create
              .mutateAsync({
                type,
                amount: activityFinanceAmountInput(amount) || 0,
                description,
                category: 'other',
                paid_at: new Date().toISOString(),
              })
              .then(() => {
                setAmount('')
                setDescription('')
              })
          }
        >
          新增明细
        </Button>
      </div>
      <RecordList items={finances} empty='尚未录入财务明细' />
    </div>
  )
}
