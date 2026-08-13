/** 商务经营驾驶舱：汇总现有业务数据并提供处理入口。 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClockAlert,
  Radio,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { EmptyState } from '@/components/shared/empty-state'
import { MetricDeck } from '@/components/shared/metric-deck'
import { RoleAvatar } from '@/components/shared/role-avatar'
import {
  opportunityStages,
  type OpportunityStage,
} from '../opportunities'
import type { BusinessDashboardSummary, DashboardOpportunity } from './types'
import {
  businessDashboardKey,
  useBusinessDashboard,
} from './use-business-dashboard'
import { updateDashboardOpportunityStage } from './dashboard-stage-update'

export type BusinessDashboardTarget =
  'clients' | 'opportunities' | 'orders' | 'social'

const stageLabels: Record<OpportunityStage, string> = {
  contact: '初步接洽',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签署',
  won: '已成交',
  lost: '已流失',
}

const orderStatusLabels: Record<string, string> = {
  negotiating: '洽谈中',
  confirmed: '已确认',
  filming: '拍摄中',
  published: '已发布',
  completed: '已完成',
  cancelled: '已取消',
}

const currency = (amount: number) =>
  `¥${Math.round(amount / 100).toLocaleString('zh-CN')}`

export function BusinessDashboard({
  onNavigate,
}: {
  onNavigate: (target: BusinessDashboardTarget) => void
}) {
  const dashboard = useBusinessDashboard()
  const queryClient = useQueryClient()
  const updateStage = useMutation({
    mutationFn: async ({
      id,
      stage,
    }: {
      id: string
      stage: OpportunityStage
    }) => {
      let reason = ''
      if (stage === 'lost') reason = window.prompt('请输入流失原因') || ''
      await updateDashboardOpportunityStage(undefined, {
        id,
        stage,
        lostReason: reason,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: businessDashboardKey })
      void queryClient.invalidateQueries({
        queryKey: ['business', 'opportunities'],
      })
      toast.success('商机阶段已更新')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === 'LOST_REASON_REQUIRED'
          ? '流失原因必填'
          : '更新失败'
      ),
  })

  if (dashboard.isLoading) return <DashboardSkeleton />
  if (dashboard.isError || !dashboard.data) {
    return (
      <EmptyState
        title='经营数据暂时无法加载'
        description='请检查数据服务和当前账号权限，客户和商机数据不会受到影响。'
        action={
          <Button onClick={() => void dashboard.refetch()}>重新加载</Button>
        }
      />
    )
  }

  return (
    <BusinessDashboardContent
      summary={dashboard.data}
      onNavigate={onNavigate}
      onStageChange={(id, stage) => updateStage.mutate({ id, stage })}
    />
  )
}

export function BusinessDashboardContent({
  summary,
  onNavigate,
  onStageChange,
}: {
  summary: BusinessDashboardSummary
  onNavigate: (target: BusinessDashboardTarget) => void
  onStageChange?: (id: string, stage: OpportunityStage) => void
}) {
  const metricCards = [
    {
      label: '总客户数',
      value: summary.metrics.totalClients,
      icon: UsersRound,
      target: 'clients' as const,
    },
    {
      label: '本月新增客户',
      value: summary.metrics.newClientsThisMonth,
      icon: UserPlus,
      target: 'clients' as const,
    },
    {
      label: '进行中商机',
      value: summary.metrics.activeOpportunities,
      icon: BriefcaseBusiness,
      target: 'opportunities' as const,
    },
    {
      label: '预计成交金额',
      value: summary.metrics.activeOpportunityAmount,
      icon: CircleDollarSign,
      target: 'opportunities' as const,
      money: true,
    },
    {
      label: '本月已发商单',
      value: summary.metrics.publishedOrdersThisMonth,
      icon: Radio,
      target: 'orders' as const,
    },
  ]

  return (
    <div className='space-y-6'>
      <MetricDeck
        aria-label='商务核心指标'
        className='gap-3 sm:grid-cols-2 xl:grid-cols-5'
      >
        {metricCards.map((metric) => (
          <Card
            key={metric.label}
            className="bento-card h-full gap-3 overflow-hidden rounded-lg py-4 shadow-none before:block before:h-0.5 before:w-10 before:bg-primary before:content-['']"
          >
            <CardHeader className='flex grid-cols-none flex-row items-center justify-between px-4'>
              <span className='text-xs font-medium text-muted-foreground'>
                {metric.label}
              </span>
              <metric.icon className='size-4 text-primary/70' />
            </CardHeader>
            <CardContent className='px-4'>
              <button
                type='button'
                className='w-full text-left'
                onClick={() => onNavigate(metric.target)}
              >
                <span className='block text-2xl font-semibold tracking-normal'>
                  <AnimatedNumber
                    value={metric.value}
                    format={
                      metric.money
                        ? currency
                        : (value) => Math.round(value).toLocaleString('zh-CN')
                    }
                  />
                </span>
                <span className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                  <TrendingUp className='size-3.5' />
                  等待对比数据
                </span>
              </button>
            </CardContent>
          </Card>
        ))}
      </MetricDeck>

      <div className='grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]'>
        <section className='min-w-0 border-y py-5'>
          <SectionHeading
            title='商机 Pipeline'
            description='拖动卡片推进阶段，点击进入完整商机管理。'
            icon={Sparkles}
            action={() => onNavigate('opportunities')}
          />
          <Pipeline
            opportunities={summary.opportunities}
            onStageChange={onStageChange}
            onOpen={() => onNavigate('opportunities')}
          />
        </section>

        <section className='border-y py-5'>
          <SectionHeading
            title='待处理动作'
            description='优先处理逾期和七日内到期商机。'
            icon={ClockAlert}
          />
          {summary.actions.length ? (
            <div className='divide-y'>
              {summary.actions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  type='button'
                  aria-label={`处理 ${action.title}`}
                  onClick={() => onNavigate('opportunities')}
                  className={`flex w-full items-center gap-3 border-l-2 py-3 pl-4 text-left transition-colors hover:bg-muted/35 ${
                    action.urgency === 'overdue'
                      ? 'border-red-500'
                      : 'border-amber-400'
                  }`}
                >
                  <span
                    className={
                      action.urgency === 'overdue'
                        ? 'flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/35'
                        : 'flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/35'
                    }
                  >
                    <CalendarClock className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>
                      {action.title}
                    </span>
                    <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                      {action.clientName} · {currency(action.amount)}
                    </span>
                  </span>
                  <Badge
                    variant={
                      action.urgency === 'overdue' ? 'destructive' : 'secondary'
                    }
                  >
                    {action.urgency === 'overdue'
                      ? `已逾期 ${Math.abs(action.daysUntilDue)} 天`
                      : `${action.daysUntilDue} 天后到期`}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title='近期没有临期商机'
              description='新的截止日期进入七天范围后会自动出现在这里。'
            />
          )}
        </section>
      </div>

      <div className='grid gap-5 lg:grid-cols-3'>
        <ResultSection
          title='最近渠道商单'
          icon={ShoppingBag}
          onOpen={() => onNavigate('orders')}
        >
          {summary.recentOrders.length ? (
            summary.recentOrders.map((order) => (
              <ResultRow
                key={order.id}
                title={order.title}
                detail={`${order.clientName} · ${currency(order.amount)}`}
                trailing={orderStatusLabels[order.status] || order.status}
              />
            ))
          ) : (
            <EmptyState
              title='还没有渠道商单'
              description='创建第一条商单后，执行状态会汇总到这里。'
            />
          )}
        </ResultSection>
        <ResultSection
          title='朋友圈计划'
          icon={CalendarClock}
          onOpen={() => onNavigate('social')}
        >
          {summary.upcomingSocialPlans.length ? (
            summary.upcomingSocialPlans.map((plan) => (
              <ResultRow
                key={plan.id}
                title={plan.content}
                detail={formatShortDate(plan.date)}
                trailing='已计划'
              />
            ))
          ) : (
            <EmptyState
              title='本周还没有发布计划'
              description='安排一条朋友圈内容，开始记录私域转化。'
            />
          )}
        </ResultSection>
        <ResultSection
          title='最近客户动态'
          icon={UsersRound}
          onOpen={() => onNavigate('clients')}
        >
          {summary.recentClients.length ? (
            summary.recentClients.map((client) => (
              <div
                key={client.id}
                className='flex items-center gap-3 border-b py-3 last:border-0'
              >
                <RoleAvatar name={client.name} role='business' />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium'>
                    {client.name}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    更新于 {formatShortDate(client.updated)}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              title='还没有客户动态'
              description='新增客户后，最近变动会显示在这里。'
            />
          )}
        </ResultSection>
      </div>
    </div>
  )
}

function Pipeline({
  opportunities,
  onStageChange,
  onOpen,
}: {
  opportunities: DashboardOpportunity[]
  onStageChange?: (id: string, stage: OpportunityStage) => void
  onOpen: () => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()
  return (
    <div className='mt-4 overflow-x-auto pb-2'>
      <div className='grid min-w-[640px] grid-cols-6 gap-3'>
        {opportunityStages.map((stage) => {
          const items = opportunities.filter((item) => item.stage === stage)
          return (
            <div
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData('text/plain')
                setDraggingId(null)
                if (id) onStageChange?.(id, stage)
              }}
              className='min-h-72 rounded-xl border border-border/60 bg-muted/20 p-3'
            >
              <div className='mb-3 flex items-center justify-between gap-2'>
                <span className='text-xs font-semibold'>
                  {stageLabels[stage]}
                </span>
                <Badge variant='secondary'>{items.length}</Badge>
              </div>
              <div className='space-y-2'>
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    type='button'
                    draggable
                    onClick={onOpen}
                    onDragStart={(event) => {
                      const dragEvent = event as unknown as DragEvent
                      dragEvent.dataTransfer?.setData('text/plain', item.id)
                      setDraggingId(item.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    animate={
                      draggingId === item.id && !reduceMotion
                        ? {
                            scale: 1.02,
                            boxShadow: '0 16px 30px rgba(15,23,42,.16)',
                          }
                        : {
                            scale: 1,
                            boxShadow: '0 1px 2px rgba(15,23,42,.06)',
                          }
                    }
                    className='w-full cursor-grab rounded-xl border border-border/70 bg-background/70 p-3 text-left backdrop-blur-md active:cursor-grabbing'
                  >
                    <span className='line-clamp-2 block text-sm font-medium'>
                      {item.title}
                    </span>
                    <span className='mt-1 block truncate text-xs text-muted-foreground'>
                      {item.clientName}
                    </span>
                    <span className='mt-3 flex items-center justify-between text-xs'>
                      <span>{currency(item.amount)}</span>
                      <span className='font-medium text-primary'>
                        {item.probability}%
                      </span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string
  description: string
  icon: typeof Sparkles
  action?: () => void
}) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <div>
        <h2 className='flex items-center gap-2 text-sm font-semibold'>
          <Icon className='size-4 text-primary' />
          {title}
        </h2>
        <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
      </div>
      {action && (
        <Button variant='ghost' size='sm' onClick={action}>
          查看全部
          <ArrowRight className='size-4' />
        </Button>
      )}
    </div>
  )
}

function ResultSection({
  title,
  icon: Icon,
  onOpen,
  children,
}: {
  title: string
  icon: typeof Sparkles
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <section className='border-t pt-4'>
      <div className='flex items-center justify-between'>
        <h2 className='flex items-center gap-2 text-sm font-semibold'>
          <Icon className='size-4 text-muted-foreground' />
          {title}
        </h2>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`查看${title}`}
          onClick={onOpen}
        >
          <ArrowRight className='size-4' />
        </Button>
      </div>
      <div className='mt-2'>{children}</div>
    </section>
  )
}

function ResultRow({
  title,
  detail,
  trailing,
}: {
  title: string
  detail: string
  trailing: string
}) {
  return (
    <div className='flex items-center gap-3 border-b py-3 last:border-0'>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{title}</span>
        <span className='block truncate text-xs text-muted-foreground'>
          {detail}
        </span>
      </span>
      <Badge variant='secondary'>{trailing}</Badge>
    </div>
  )
}

function formatShortDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '日期待定'
    : new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: 'numeric',
        day: 'numeric',
      }).format(date)
}

function DashboardSkeleton() {
  return (
    <div aria-label='正在加载经营驾驶舱' className='space-y-5'>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className='h-28 animate-pulse rounded-lg bg-muted' />
        ))}
      </div>
      <div className='h-[420px] animate-pulse rounded-lg bg-muted' />
    </div>
  )
}
