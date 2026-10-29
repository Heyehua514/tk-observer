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
import { getDataProvider } from '@/lib/data-provider'
import { formatBeijingTime } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useRollbackVideoIdeaImport } from '../hooks/use-rollback-video-idea-import'
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
  const [rollbackTarget, setRollbackTarget] = useState<ImportHistory | null>(
    null
  )
  const rollback = useRollbackVideoIdeaImport()
  const canRollback = getDataProvider() === 'supabase'

  const confirmRollback = async () => {
    if (!rollbackTarget) return
    try {
      await rollback.mutateAsync(rollbackTarget.id)
      setRollbackTarget(null)
      setSelected(null)
    } catch {
      // The mutation hook reports the database conflict without closing the dialog.
    }
  }

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
                <div
                  key={item.id}
                  className='flex flex-col gap-3 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between'
                >
                  <button
                    className='min-w-0 flex-1 text-left'
                    onClick={() => setSelected(item)}
                  >
                    <div className='truncate font-medium'>{item.fileName}</div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {formatBeijingTime(item.importedAt)}
                    </div>
                  </button>
                  <div className='flex flex-wrap items-center gap-2 text-right text-sm'>
                    <Badge
                      variant={
                        item.status === 'rolled_back' ? 'secondary' : 'default'
                      }
                    >
                      {item.status === 'rolled_back' ? '已撤销' : '已完成'}
                    </Badge>
                    <span>新增 {item.newCount} 条</span>
                    {item.updatedCount > 0 && (
                      <span>更新 {item.updatedCount} 条</span>
                    )}
                    {item.skippedCount > 0 && (
                      <span>跳过 {item.skippedCount} 条</span>
                    )}
                    {item.failureCount > 0 && (
                      <span className='text-destructive'>
                        失败 {item.failureCount} 条
                      </span>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      共 {item.totalRows} 行
                    </span>
                    {item.status === 'completed' && canRollback && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setRollbackTarget(item)}
                      >
                        整批撤销
                      </Button>
                    )}
                  </div>
                </div>
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
            <DialogDescription>这次导入的状态与指标快照</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3'>
                <div>
                  <div className='text-muted-foreground'>状态</div>
                  <div className='font-medium'>
                    {selected.status === 'rolled_back' ? '已撤销' : '已完成'}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>总行数</div>
                  <div className='font-medium'>{selected.totalRows}</div>
                </div>
                <div>
                  <div className='text-muted-foreground'>新增 / 更新</div>
                  <div className='font-medium'>
                    {selected.newCount} / {selected.updatedCount}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>重复跳过</div>
                  <div className='font-medium'>{selected.skippedCount}</div>
                </div>
                <div>
                  <div className='text-muted-foreground'>校验失败</div>
                  <div className='font-medium'>{selected.failureCount}</div>
                </div>
                {selected.rolledBackAt && (
                  <div>
                    <div className='text-muted-foreground'>撤销时间</div>
                    <div className='font-medium'>
                      {formatBeijingTime(selected.rolledBackAt)}
                    </div>
                  </div>
                )}
              </div>
              <dl className='grid grid-cols-2 gap-3 text-sm'>
                {Object.entries(selected.snapshot).map(([key, value]) => (
                  <div key={key}>
                    <dt className='text-muted-foreground'>
                      {snapshotLabels[key as keyof MetricSnapshot]}
                    </dt>
                    <dd className='font-medium'>
                      {typeof value === 'number'
                        ? value.toLocaleString()
                        : value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(rollbackTarget)}
        onOpenChange={(open) => !open && setRollbackTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认整批撤销这次导入？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除本批次新增的 {rollbackTarget?.newCount || 0}{' '}
              条记录，并恢复本批次更新的 {rollbackTarget?.updatedCount || 0}{' '}
              条记录导入前数据。若批次内记录在导入后被修改或删除，系统会拒绝撤销且不会产生部分回滚。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollback.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              disabled={rollback.isPending}
              onClick={(event) => {
                event.preventDefault()
                void confirmRollback()
              }}
            >
              {rollback.isPending ? '撤销中...' : '确认撤销'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        <Card className='bento-card shadow-none'>
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
                    fill='var(--chart-1)'
                    animationDuration={1000}
                  />
                  <Bar
                    yAxisId='views'
                    dataKey='likes'
                    name='点赞数'
                    fill='var(--chart-3)'
                    animationDuration={1000}
                  />
                  <Bar
                    yAxisId='views'
                    dataKey='comments'
                    name='评论数'
                    fill='var(--chart-5)'
                    animationDuration={1000}
                  />
                  <Bar
                    yAxisId='completion'
                    dataKey='averageCompletionRate'
                    name='平均完播率'
                    fill='var(--chart-2)'
                    animationDuration={1000}
                  />
                  <Bar
                    yAxisId='viral'
                    dataKey='viralCount'
                    name='总爆款数'
                    fill='var(--chart-4)'
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className='bento-card shadow-none'>
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
                    fill='var(--chart-1)'
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className='bento-card shadow-none'>
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
