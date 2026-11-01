/** 成片表现时序趋势面板：增量曲线、中位数基线与爆款预警。 */
import { Activity, AlertTriangle, Eye, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatBeijingTime } from '@/lib/format'
import { useVideoMetricsLogs } from '../hooks/use-video-metrics-logs'
import { buildMetricsTrend, getDeltaBarPercent } from '../video-metrics-trend'

function formatDelta(value: number): string {
  return value >= 10000
    ? `+${(value / 10000).toFixed(1).replace(/\.0$/u, '')}万`
    : `+${value.toLocaleString('zh-CN')}`
}

export function VideoMetricsTrendPanel({ videoId }: { videoId: string }) {
  const logs = useVideoMetricsLogs(videoId)

  if (!videoId) return null

  if (logs.isLoading) {
    return (
      <div className='rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground'>
        正在加载历史打卡数据...
      </div>
    )
  }

  const trend = buildMetricsTrend(logs.data || [])

  if (trend.points.length < 2) {
    return (
      <div className='rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground'>
        至少两次打卡后才会生成增量曲线与爆款预警。当前 {trend.points.length} 次。
      </div>
    )
  }

  return (
    <div className='space-y-3 rounded-lg border bg-muted/20 p-3' data-testid='video-metrics-trend'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5 text-xs font-medium text-foreground'>
          <Activity className='size-3.5 text-primary' />
          播放量增量走势（共 {trend.points.length} 次打卡）
        </div>
        {trend.viralCount > 0 ? (
          <Badge variant='destructive' className='gap-1'>
            <AlertTriangle className='size-3' />
            {trend.viralCount} 次爆款预警
          </Badge>
        ) : (
          <Badge variant='secondary'>节奏平稳</Badge>
        )}
      </div>

      <div className='grid grid-cols-3 gap-2 text-xs'>
        <div className='rounded-md border bg-background p-2'>
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Eye className='size-3' /> 累计新增播放
          </div>
          <div className='mt-0.5 font-semibold text-foreground'>
            {formatDelta(trend.totalViewDelta)}
          </div>
        </div>
        <div className='rounded-md border bg-background p-2'>
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Heart className='size-3' /> 累计新增点赞
          </div>
          <div className='mt-0.5 font-semibold text-foreground'>
            {formatDelta(trend.totalLikeDelta)}
          </div>
        </div>
        <div className='rounded-md border bg-background p-2'>
          <div className='text-muted-foreground'>中位数基线</div>
          <div className='mt-0.5 font-semibold text-foreground'>
            {trend.medianViewDelta.toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      <div className='space-y-1.5'>
        {trend.points.map((point) => (
          <div
            key={point.id}
            className='flex items-center gap-2 text-xs'
            data-viral={point.viral ? 'true' : 'false'}
          >
            <span className='w-24 shrink-0 text-muted-foreground'>
              {formatBeijingTime(point.loggedAt)}
            </span>
            <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
              <div
                className={
                  point.viral
                    ? 'h-full rounded-full bg-destructive'
                    : 'h-full rounded-full bg-primary/60'
                }
                style={{
                  width: `${getDeltaBarPercent(point.viewDelta, trend.peakViewDelta)}%`,
                }}
              />
            </div>
            <span className='w-20 shrink-0 text-right font-medium text-foreground'>
              {point.viewDelta ? formatDelta(point.viewDelta) : '基线'}
            </span>
            <span className='w-16 shrink-0 text-right text-muted-foreground'>
              {point.viral ? '爆款' : `赞 ${point.likeDelta}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}