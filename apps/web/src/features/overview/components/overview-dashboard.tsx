/** 总览工作台主体：经营指标、GMV 趋势、团队动态与成员任务进度。 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  ClipboardList,
  Clapperboard,
  UsersRound,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDataProvider } from '@/lib/data-provider'
import { formatMoney } from '@/lib/format'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { EmptyState } from '@/components/shared/empty-state'
import { MetricDeck } from '@/components/shared/metric-deck'
import { PageHeader } from '@/components/shared/page-header'
import { RoleAvatar } from '@/components/shared/role-avatar'
import { useEvents } from '@/features/market/hooks/use-market-records'
import { AiAssistantPanel } from '@/features/shared-ai'
import { TeamMemory } from '../team-memory'
import { ActivityStatusChart } from './activity-status-chart'
import { GmvEntryDialog } from './gmv-entry-dialog'
import {
  mapSupabaseAuditLog,
  mapSupabaseGmvMetric,
  mapSupabaseTeamTask,
  type OverviewAuditLog,
  type OverviewGmvMetric,
  type OverviewTeamTask,
} from './overview-dashboard-supabase-mapper'
import {
  CNY_ACCOUNTING_NOTE,
  filterGmvMetricsByRange,
  type OverviewMetricRange,
} from './overview-metrics'
import { UpcomingActivities } from './upcoming-activities'

const team = ['磊哥', '董雨辰', '韩素云', '孙铭泽', '谢洁']
const rangeLabels: Record<OverviewMetricRange, string> = {
  '7d': '近 7 天',
  '30d': '近 30 天',
  all: '全部',
}
type OverviewDashboardData = {
  gmv: OverviewGmvMetric[]
  creators: number
  tasks: number
  videos: number
  logs: OverviewAuditLog[]
  teamTasks: OverviewTeamTask[]
}

export function OverviewDashboard() {
  const [metricRange, setMetricRange] = useState<OverviewMetricRange>('30d')
  const events = useEvents()
  const data = useQuery({
    queryKey: ['overview-dashboard'],
    queryFn: async (): Promise<OverviewDashboardData> => {
      if (getDataProvider() === 'supabase') {
        const [gmv, creators, tasks, videos, logs, teamTasks] =
          await Promise.all([
            getSupabaseClient()
              .from('gmv_metrics')
              .select('id,metric_date,amount_minor')
              .is('deleted_at', null)
              .order('metric_date'),
            getSupabaseClient()
              .from('creators')
              .select('id', { count: 'exact', head: true })
              .eq('cooperation_status', 'signed')
              .is('deleted_at', null),
            getSupabaseClient()
              .from('team_tasks')
              .select('id', { count: 'exact', head: true })
              .lt('progress', 100)
              .is('deleted_at', null),
            getSupabaseClient()
              .from('videos')
              .select('id', { count: 'exact', head: true })
              .is('deleted_at', null),
            getSupabaseClient()
              .from('audit_logs')
              .select('id,actor_name,action,created_at')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(8),
            getSupabaseClient()
              .from('team_tasks')
              .select('id,assignee_name,progress')
              .is('deleted_at', null)
              .order('assignee_name'),
          ])
        if (gmv.error) throw gmv.error
        if (creators.error) throw creators.error
        if (tasks.error) throw tasks.error
        if (videos.error) throw videos.error
        if (logs.error) throw logs.error
        if (teamTasks.error) throw teamTasks.error
        return {
          gmv: (gmv.data || []).map(mapSupabaseGmvMetric),
          creators: creators.count || 0,
          tasks: tasks.count || 0,
          videos: videos.count || 0,
          logs: (logs.data || []).map(mapSupabaseAuditLog),
          teamTasks: (teamTasks.data || []).map(mapSupabaseTeamTask),
        }
      }
      const [gmv, creators, tasks, videos, logs, teamTasks] = await Promise.all(
        [
          pb.collection('gmv_metrics').getFullList({ sort: 'metric_date' }),
          pb
            .collection('creators')
            .getList(1, 1, { filter: 'cooperation_status = "signed"' }),
          pb
            .collection('team_tasks')
            .getList(1, 1, { filter: 'progress < 100' }),
          pb.collection('videos').getList(1, 1),
          pb.collection('audit_logs').getList(1, 8, { sort: '-created' }),
          pb.collection('team_tasks').getFullList({ sort: 'assignee_name' }),
        ]
      )
      return {
        gmv: gmv.map((item) => ({
          id: item.id,
          metricDate: String(item.metric_date || ''),
          amountMinor: Number(item.amount_minor || 0),
        })),
        creators: creators.totalItems,
        tasks: tasks.totalItems,
        videos: videos.totalItems,
        logs: logs.items.map((item) => ({
          id: item.id,
          actorName: String(item.actor_name || ''),
          action: String(item.action || ''),
          created: String(item.created || ''),
        })),
        teamTasks: teamTasks.map((item) => ({
          id: item.id,
          assigneeName: String(item.assignee_name || ''),
          progress: Number(item.progress || 0),
        })),
      }
    },
  })
  const gmvRecords = filterGmvMetricsByRange(data.data?.gmv || [], metricRange)
  const trend = gmvRecords.length
    ? gmvRecords.map((item) => ({
        date: item.metricDate.slice(5, 10),
        value: item.amountMinor,
      }))
    : []
  const totalGmv = gmvRecords.reduce((sum, item) => sum + item.amountMinor, 0)
  const latestGmv = gmvRecords[gmvRecords.length - 1]?.amountMinor || 0
  const previousGmv = gmvRecords[gmvRecords.length - 2]?.amountMinor || 0
  const gmvDelta = previousGmv
    ? ((latestGmv - previousGmv) / previousGmv) * 100
    : null
  const metrics = [
    {
      label: `${rangeLabels[metricRange]} GMV`,
      value: totalGmv,
      icon: CircleDollarSign,
      money: true,
      delta: gmvDelta,
    },
    {
      label: '在跑达人数',
      value: data.data?.creators ?? 0,
      icon: UsersRound,
      delta: null,
    },
    {
      label: '待办任务数',
      value: data.data?.tasks ?? 0,
      icon: ClipboardList,
      delta: null,
    },
    {
      label: '本周出片数',
      value: data.data?.videos ?? 0,
      icon: Clapperboard,
      delta: null,
    },
  ]

  return (
    <div className='space-y-6'>
      <PageHeader
        title='总览工作台'
        description='查看经营走势、团队进度和最近业务动态。'
      />
      <MetricDeck
        aria-label='经营核心指标'
        className='sm:grid-cols-2 xl:grid-cols-4'
      >
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="bento-card h-full overflow-hidden shadow-none before:block before:h-0.5 before:w-12 before:bg-primary before:content-['']"
          >
            <CardContent className='flex items-start justify-between p-5'>
              <div>
                <p className='text-sm text-muted-foreground'>{metric.label}</p>
                <p className='mt-2 text-2xl font-semibold'>
                  <AnimatedNumber
                    value={metric.value}
                    format={
                      metric.money
                        ? (value) => formatMoney(Math.round(value))
                        : (value) => Math.round(value).toLocaleString('zh-CN')
                    }
                  />
                </p>
                <MetricTrend delta={metric.delta} />
              </div>
              <metric.icon className='size-5 text-primary' />
            </CardContent>
          </Card>
        ))}
      </MetricDeck>
      <div className='mt-1'>
        <AiAssistantPanel
          scope='总览工作台'
          context={`近 ${metricRange === 'all' ? '全部' : metricRange === '7d' ? '7 天' : '30 天'} GMV 总额 ¥${(totalGmv / 100).toLocaleString()}`}
        />
      </div>
      <div className='grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
        <Card className='bento-card shadow-none'>
          <CardHeader>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <CardTitle className='text-base'>GMV 走势</CardTitle>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {CNY_ACCOUNTING_NOTE}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <GmvEntryDialog />
                <div
                  aria-label='GMV 时间范围'
                  className='flex items-center gap-1'
                >
                  {(Object.keys(rangeLabels) as OverviewMetricRange[]).map(
                    (range) => (
                      <Button
                        key={range}
                        size='sm'
                        variant={metricRange === range ? 'default' : 'outline'}
                        onClick={() => setMetricRange(range)}
                      >
                        {rangeLabels[range]}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={trend}>
                <defs>
                  <linearGradient id='gmvFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='0%'
                      stopColor='var(--chart-1)'
                      stopOpacity={0.28}
                    />
                    <stop
                      offset='100%'
                      stopColor='var(--chart-1)'
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='var(--border)'
                />
                <XAxis dataKey='date' tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value: number) =>
                    `¥${Math.round(value / 100 / 1000)}k`
                  }
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value || 0))}
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='var(--chart-1)'
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                  fill='url(#gmvFill)'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className='bento-card shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Activity className='size-4' />
              团队动态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.data?.logs.length ? (
              <div className='relative space-y-5 before:absolute before:inset-y-1 before:left-[5px] before:w-px before:bg-border'>
                {data.data.logs.map((log) => (
                  <div key={log.id} className='relative pl-6 text-sm'>
                    <span
                      aria-hidden='true'
                      className='absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-background bg-primary shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_55%,transparent)]'
                    />
                    <div className='font-medium'>
                      {log.actorName} · {log.action}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {log.created.replace('Z', ' UTC')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title='等待团队动态沉淀'
                description='成员开始维护业务数据后，操作记录会显示在这里。'
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-6 xl:grid-cols-2'>
        <UpcomingActivities events={events.data || []} />
        <ActivityStatusChart events={events.data || []} />
      </div>
      <TeamMemory />
      <Card className='bento-card shadow-none'>
        <CardHeader>
          <CardTitle className='text-base'>成员任务进度</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {team.map((name, index) => {
            const task = data.data?.teamTasks.find(
              (item) => item.assigneeName === name
            )
            const progress = Number(
              task?.progress ?? [82, 68, 54, 76, 61][index]
            )
            return (
              <div
                key={name}
                className='grid grid-cols-[34px_72px_1fr_44px] items-center gap-3 text-sm'
              >
                <RoleAvatar
                  name={name}
                  role={
                    ['boss', 'business', 'market', 'design', 'editing'][
                      index
                    ] as 'boss' | 'business' | 'market' | 'design' | 'editing'
                  }
                />
                <span>{name}</span>
                <div className='h-2 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className='text-right text-muted-foreground'>
                  {progress}%
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricTrend({ delta }: { delta: number | null }) {
  if (delta === null)
    return <p className='mt-1 text-xs text-muted-foreground'>等待下一条数据</p>
  const positive = delta >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <p
      className={
        positive
          ? 'mt-1 flex items-center gap-1 text-xs text-emerald-600'
          : 'mt-1 flex items-center gap-1 text-xs text-red-600'
      }
    >
      <Icon className='size-3.5' />
      {Math.abs(delta).toFixed(1)}%
    </p>
  )
}
