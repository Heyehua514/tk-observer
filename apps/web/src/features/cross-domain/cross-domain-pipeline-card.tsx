/**
 * 出海全主链路流水线实况卡片 (Cross-Domain Pipeline Live Card)
 * 聚合展示：爆品雷达 ➔ 选品中心 ➔ 达人CRM ➔ 视频矩阵 ➔ 发布排期与打卡复盘
 */
import { Link } from '@tanstack/react-router'
import {
  Flame,
  ShoppingBag,
  Users,
  Clapperboard,
  BarChart3,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCrossDomainPipelineStats } from './use-cross-domain-stats'
import type { PipelineStageId } from './cross-domain-stats'

const stageIcons: Record<PipelineStageId, React.ElementType> = {
  radar: Flame,
  product: ShoppingBag,
  creator: Users,
  video: Clapperboard,
  review: BarChart3,
}

export function CrossDomainPipelineCard() {
  const { data: summary, isLoading } = useCrossDomainPipelineStats()

  if (isLoading || !summary) {
    return (
      <Card className='bento-card shadow-none'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-semibold'>出海主链路加载中...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-24 animate-pulse rounded-lg bg-muted/40' />
        </CardContent>
      </Card>
    )
  }

  const statusBadge =
    summary.overallStatus === 'excellent' ? (
      <Badge variant='outline' className='border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
        <ShieldCheck className='mr-1 size-3 text-emerald-600' />
        链路健康度 {summary.overallHealthScore} 分 · 顺畅
      </Badge>
    ) : summary.overallStatus === 'normal' ? (
      <Badge variant='outline' className='border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'>
        <Sparkles className='mr-1 size-3 text-blue-600' />
        链路健康度 {summary.overallHealthScore} 分 · 稳健
      </Badge>
    ) : (
      <Badge variant='outline' className='border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>
        <AlertTriangle className='mr-1 size-3 text-amber-600' />
        链路健康度 {summary.overallHealthScore} 分 · 待推进
      </Badge>
    )

  return (
    <Card className='bento-card shadow-none overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <CardTitle className='text-base font-semibold'>跨境出海全主链路流水线</CardTitle>
              {statusBadge}
            </div>
            <CardDescription className='mt-1 text-xs'>
              {summary.headline}
            </CardDescription>
          </div>
          <div className='text-xs text-muted-foreground'>
            覆盖：选品雷达 ➔ 达人邀约 ➔ 视频剪辑 ➔ 自动排期 ➔ 数据复盘
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* 5 阶段水平流转面板 */}
        <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5'>
          {summary.stages.map((stage, idx) => {
            const Icon = stageIcons[stage.id]
            const isLast = idx === summary.stages.length - 1

            return (
              <div
                key={stage.id}
                className='relative flex flex-col justify-between rounded-xl border bg-card/60 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30 dark:bg-card'
              >
                <div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <div className='flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary'>
                        <Icon className='size-3.5' />
                      </div>
                      <span className='text-xs font-semibold text-foreground'>
                        {stage.stageNumber}. {stage.name}
                      </span>
                    </div>
                    {!isLast && (
                      <ChevronRight className='hidden size-3.5 text-muted-foreground/40 lg:block' />
                    )}
                  </div>

                  <div className='mt-2.5'>
                    <div className='text-xl font-bold tracking-tight text-foreground'>
                      {stage.metricValue}
                    </div>
                    <div className='text-[11px] text-muted-foreground mt-0.5 font-medium'>
                      {stage.metricLabel}
                    </div>
                    <div className='text-[10px] text-muted-foreground/80 mt-1 line-clamp-2'>
                      {stage.subText}
                    </div>
                  </div>
                </div>

                <div className='mt-3 pt-2 border-t border-border/50'>
                  <Button
                    size='sm'
                    variant='ghost'
                    asChild
                    className='h-6 w-full justify-between px-1 text-[11px] font-normal hover:text-primary'
                  >
                    <Link to={stage.actionHref}>
                      <span>{stage.actionLabel}</span>
                      <ArrowUpRight className='size-3' />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 智能流转建议横幅 */}
        {summary.actionableInsights.length > 0 && (
          <div className='flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs'>
            <Sparkles className='size-4 shrink-0 text-primary mt-0.5' />
            <div className='space-y-0.5 text-muted-foreground'>
              <span className='font-semibold text-foreground'>链路提效建议：</span>
              <span>{summary.actionableInsights.join('；')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
