/** 总览工作台主体：经营指标、GMV 趋势、团队动态与成员任务进度。 */
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
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
import { formatMoney } from '@/lib/format'
import { pb } from '@/lib/pocketbase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

const fallbackTrend = [
  { date: '08-01', value: 126000 },
  { date: '08-08', value: 184000 },
  { date: '08-15', value: 163000 },
  { date: '08-22', value: 236000 },
  { date: '08-29', value: 278000 },
]
const team = ['磊哥', '董雨辰', '韩素云', '孙铭泽', '谢洁']

export function OverviewDashboard() {
  const data = useQuery({
    queryKey: ['overview-dashboard'],
    queryFn: async () => {
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
        gmv,
        creators: creators.totalItems,
        tasks: tasks.totalItems,
        videos: videos.totalItems,
        logs: logs.items,
        teamTasks,
      }
    },
  })
  const trend = data.data?.gmv.length
    ? data.data.gmv.map((item) => ({
        date: String(item.metric_date).slice(5, 10),
        value: Number(item.amount_minor),
      }))
    : fallbackTrend
  const totalGmv =
    data.data?.gmv.reduce((sum, item) => sum + Number(item.amount_minor), 0) ||
    987600
  const metrics = [
    { label: '本月 GMV', value: formatMoney(totalGmv), icon: CircleDollarSign },
    { label: '在跑达人数', value: data.data?.creators ?? 0, icon: UsersRound },
    { label: '待办任务数', value: data.data?.tasks ?? 0, icon: ClipboardList },
    { label: '本周出片数', value: data.data?.videos ?? 0, icon: Clapperboard },
  ]

  return (
    <div className='space-y-6'>
      <PageHeader
        title='总览工作台'
        description='查看经营走势、团队进度和最近业务动态。'
      />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((metric) => (
          <Card key={metric.label} className='shadow-none'>
            <CardContent className='flex items-start justify-between p-5'>
              <div>
                <p className='text-sm text-muted-foreground'>{metric.label}</p>
                <p className='mt-2 text-2xl font-semibold'>{metric.value}</p>
              </div>
              <metric.icon className='size-5 text-blue-600' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>GMV 走势</CardTitle>
          </CardHeader>
          <CardContent className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='date' tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value: number) =>
                    `$${Math.round(value / 100 / 1000)}k`
                  }
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value || 0))}
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='#2563eb'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Activity className='size-4' />
              团队动态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.data?.logs.length ? (
              <div className='space-y-4'>
                {data.data.logs.map((log) => (
                  <div
                    key={log.id}
                    className='border-b pb-3 text-sm last:border-0'
                  >
                    <div className='font-medium'>
                      {String(log.actor_name)} · {String(log.action)}
                    </div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {String(log.created).replace('Z', ' UTC')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title='暂无团队动态'
                description='成员开始维护业务数据后，操作记录会显示在这里。'
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle className='text-base'>成员任务进度</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {team.map((name, index) => {
            const task = data.data?.teamTasks.find(
              (item) => item.assignee_name === name
            )
            const progress = Number(
              task?.progress ?? [82, 68, 54, 76, 61][index]
            )
            return (
              <div
                key={name}
                className='grid grid-cols-[72px_1fr_44px] items-center gap-3 text-sm'
              >
                <span>{name}</span>
                <div className='h-2 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-blue-600'
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
