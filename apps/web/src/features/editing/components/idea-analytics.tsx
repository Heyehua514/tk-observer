/**
 * 选题库数据分析 Tab。
 * 路由：/editing?section=ideas&tab=analytics；权限：editing, boss。
 * 指标来自 PocketBase 当前数据与 import_history 快照，导入成功后实时刷新。
 */
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useImportHistory } from '../hooks/use-import-history'
import { useVideoIdeaAnalytics } from '../hooks/use-video-idea-analytics'
import type { ImportHistory, MetricSnapshot } from '../types'
import { editingDataErrorDescription } from './editing-empty-copy'

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta?: string
}) {
  return (
    <Card className='gap-3 py-4 shadow-none'>
      <CardHeader className='px-4'>
        <CardTitle className='text-sm font-normal text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <div className='text-2xl font-semibold'>{value}</div>
        {delta && (
          <div className='mt-1 text-xs text-muted-foreground'>{delta}</div>
        )}
      </CardContent>
    </Card>
  )
}

function countDelta(
  current: number,
  previous: number | undefined,
  unit: string
) {
  if (previous === undefined) return '暂无上次导入对比'
  const delta = current - previous
  if (delta === 0) return '与上次导入持平'
  return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toLocaleString()} ${unit}`
}

function percentDelta(current: number, previous: number | undefined) {
  if (previous === undefined) return '暂无上次导入对比'
  if (current === previous) return '与上次导入持平'
  if (previous === 0) return `↑ ${Math.abs(current).toFixed(1)}%`
  const delta = ((current - previous) / Math.abs(previous)) * 100
  return `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}%`
}

const snapshotLabels: Record<keyof MetricSnapshot, string> = {
  totalVideos: '总视频数',
  monthlyNew: '本月新增',
  viralCount: '爆款数',
  viralRate: '爆款率',
  averageCompletionRate: '平均完播率',
  averageViews: '平均播放量',
  totalFollowerGain: '总涨粉数',
}

function ImportHistoryTimeline({ history }: { history: ImportHistory[] }) {
  const [selected, setSelected] = useState<ImportHistory | null>(null)
  return (
    <>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle className='text-base'>数据更新历史</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              CSV 导入后，这里会显示每次导入带来的变化。
            </p>
          ) : (
            <div className='space-y-3'>
              {history.map((item) => (
                <button
                  key={item.id}
                  className='flex w-full items-center justify-between gap-4 border-b pb-3 text-left last:border-0 last:pb-0'
                  onClick={() => setSelected(item)}
                >
                  <div>
                    <div className='font-medium'>{item.fileName}</div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {formatBeijingTime(item.importedAt)}
                    </div>
                  </div>
                  <div className='text-right text-sm'>
                    <div>新增 {item.newCount} 条</div>
                    <div className='text-xs text-muted-foreground'>
                      共 {item.totalRows} 行
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{selected?.fileName}</DialogTitle>
            <DialogDescription>这次导入带来的指标快照</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className='grid grid-cols-2 gap-3 text-sm'>
              {Object.entries(selected.snapshot).map(([key, value]) => (
                <div key={key}>
                  <dt className='text-muted-foreground'>
                    {snapshotLabels[key as keyof MetricSnapshot]}
                  </dt>
                  <dd className='font-medium'>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function IdeaAnalytics() {
  const analytics = useVideoIdeaAnalytics()
  const history = useImportHistory()
  if (analytics.isError || history.isError)
    return (
      <EmptyState
        title='分析数据加载失败'
        description={editingDataErrorDescription}
      />
    )
  if (!analytics.data)
    return (
      <EmptyState
        title='等待分析数据生成'
        description='新增选题或导入 CSV 后，这里会自动生成分析看板。'
      />
    )
  const { metrics, accountData, typeData, viralFeatures, previousImport } =
    analytics.data
  const previous = previousImport?.snapshot
  return (
    <div className='space-y-6'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <MetricCard
          label='总视频数'
          value={metrics.totalVideos.toLocaleString()}
          delta={countDelta(metrics.totalVideos, previous?.totalVideos, '条')}
        />
        <MetricCard
          label='本月新增'
          value={metrics.monthlyNew.toLocaleString()}
          delta={countDelta(metrics.monthlyNew, previous?.monthlyNew, '条')}
        />
        <MetricCard
          label='爆款率'
          value={`${metrics.viralRate.toFixed(1)}%`}
          delta={percentDelta(metrics.viralRate, previous?.viralRate)}
        />
        <MetricCard
          label='平均完播率'
          value={`${metrics.averageCompletionRate.toFixed(1)}%`}
          delta={percentDelta(
            metrics.averageCompletionRate,
            previous?.averageCompletionRate
          )}
        />
        <MetricCard
          label='平均播放量'
          value={Math.round(metrics.averageViews).toLocaleString()}
          delta={percentDelta(metrics.averageViews, previous?.averageViews)}
        />
        <MetricCard
          label='总涨粉数'
          value={metrics.totalFollowerGain.toLocaleString()}
          delta={countDelta(
            metrics.totalFollowerGain,
            previous?.totalFollowerGain,
            '人'
          )}
        />
      </div>
      <div className='grid gap-6 xl:grid-cols-2'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>各账号对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={accountData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey='account' tick={{ fontSize: 12 }} />
                  <YAxis yAxisId='views' />
                  <YAxis
                    yAxisId='completion'
                    orientation='right'
                    domain={[0, 100]}
                    unit='%'
                  />
                  <YAxis yAxisId='viral' hide allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId='views'
                    dataKey='views'
                    name='总播放量'
                    fill='#2563eb'
                    animationDuration={800}
                  />
                  <Bar
                    yAxisId='completion'
                    dataKey='averageCompletionRate'
                    name='平均完播率'
                    fill='#14b8a6'
                    animationDuration={800}
                  />
                  <Bar
                    yAxisId='viral'
                    dataKey='viralCount'
                    name='总爆款数'
                    fill='#f97316'
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>各视频类型对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={typeData}
                  layout='vertical'
                  margin={{ left: 12, right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type='number' unit='%' />
                  <YAxis
                    type='category'
                    dataKey='videoType'
                    width={72}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey='averageCompletionRate'
                    name='平均完播率'
                    fill='#2563eb'
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle className='text-base'>爆款特征分析</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.viralCount === 0 ? (
            <p className='text-sm text-muted-foreground'>
              当前没有爆款记录，筛选“仅看爆款”后会在这里汇总高频词、类型、标签和发布日期段。
            </p>
          ) : (
            <div className='grid gap-5 md:grid-cols-4'>
              {[
                ['标题高频词', viralFeatures.titleWords],
                ['最多视频类型', viralFeatures.videoTypes],
                ['常见标签', viralFeatures.tags],
                ['最佳发布日期段', viralFeatures.dateSegments],
              ].map(([label, values]) => (
                <div key={label as string}>
                  <h3 className='mb-2 text-sm font-medium'>
                    {label as string}
                  </h3>
                  <div className='space-y-2'>
                    {(values as { value: string; count: number }[]).map(
                      (item) => (
                        <div
                          key={item.value}
                          className='flex items-center justify-between text-sm'
                        >
                          <span className='truncate'>{item.value}</span>
                          <Badge variant='secondary'>{item.count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ImportHistoryTimeline history={history.data?.items || []} />
    </div>
  )
}
