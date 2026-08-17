/** 总览活动阶段分布：复用 events 数据的只读管理图表。 */
import { ChartNoAxesColumnIncreasing } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import type { Event } from '@/features/market/types'
import { buildActivityStatusChart } from './activity-status-chart-model'

export function ActivityStatusChart({ events }: { events: Event[] }) {
  const data = buildActivityStatusChart(events)
  return (
    <Card className='bento-card shadow-none'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <ChartNoAxesColumnIncreasing className='size-4' />
          活动阶段分布
        </CardTitle>
      </CardHeader>
      <CardContent className='h-64'>
        {data.length ? (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='status' tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} />
              <Bar
                dataKey='count'
                name='活动数'
                fill='var(--chart-2)'
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center'>
            <EmptyState
              title='等待活动阶段数据沉淀'
              description='创建活动并进入筹备后，阶段分布会自动更新。'
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
