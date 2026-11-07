import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrossWorkspaceTasks } from '../hooks/use-cross-workspace-tasks'
import {
  filterPendingTasks,
  type CrossWorkspaceTask,
} from './cross-workspace-tasks-model'

const workspaceLabels: Record<
  CrossWorkspaceTask['workspace'],
  { name: string; href: string }
> = {
  design: { name: '设计', href: '/design' },
  editing: { name: '剪辑', href: '/editing' },
  business: { name: '商机', href: '/business' },
  team: { name: '团队', href: '/intelligence' },
}

function TaskDetail({
  task,
  suffix = '',
  className,
}: {
  task: CrossWorkspaceTask
  suffix?: string
  className: string
}) {
  const details: string[] = []
  if (task.dueAt) details.push(`截止: ${task.dueAt.slice(0, 10)}${suffix}`)
  if (task.assigneeName) details.push(`负责人: ${task.assigneeName}`)
  if (!details.length) return null

  return <p className={className}>{details.join(' · ')}</p>
}

export function CrossWorkspaceTasks({
  tasks,
}: {
  tasks?: CrossWorkspaceTask[]
}) {
  const query = useCrossWorkspaceTasks()
  const effectiveTasks = tasks ?? query.data ?? []
  const { overdue, dueSoon, normal } = filterPendingTasks(effectiveTasks)
  const totalActionable = overdue.length + dueSoon.length
  const isLoading = tasks === undefined && query.isLoading
  const isError = tasks === undefined && query.isError

  return (
    <Card className='bento-card shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <div className='flex items-center gap-2'>
          <CardTitle className='text-base font-semibold'>
            跨工作台待办与风险
          </CardTitle>
          {isLoading ? (
            <Badge variant='outline' className='h-5 px-1.5 text-xs'>
              加载中
            </Badge>
          ) : isError ? (
            <Badge variant='destructive' className='h-5 px-1.5 text-xs'>
              加载失败
            </Badge>
          ) : totalActionable > 0 ? (
            <Badge variant='destructive' className='h-5 px-1.5 text-xs'>
              {totalActionable} 项待关注
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='h-5 border-emerald-300 px-1.5 text-xs text-emerald-600'
            >
              进度正常
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            <span>正在汇总各工作台待办...</span>
          </div>
        ) : isError ? (
          <div className='flex items-center gap-2 py-4 text-sm text-destructive'>
            <AlertCircle className='size-4' />
            <span>待办加载失败，请稍后重试。</span>
          </div>
        ) : overdue.length === 0 &&
          dueSoon.length === 0 &&
          normal.length === 0 ? (
          <div className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
            <CheckCircle2 className='size-4 text-emerald-500' />
            <span>所有工作台暂无未完成待办，运转顺畅。</span>
          </div>
        ) : (
          <div className='space-y-3'>
            {overdue.map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border border-red-200/60 bg-red-50/40 p-2.5 dark:border-red-950 dark:bg-red-950/20'
              >
                <div className='flex min-w-0 items-center gap-2.5 pr-2'>
                  <AlertCircle className='size-4 shrink-0 text-red-600' />
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='h-4 shrink-0 border-red-300 px-1 py-0 text-[10px] text-red-700'
                      >
                        {workspaceLabels[task.workspace].name}
                      </Badge>
                      <span className='truncate text-sm font-medium text-red-900 dark:text-red-300'>
                        {task.title}
                      </span>
                    </div>
                    <TaskDetail
                      task={task}
                      suffix=' (已逾期)'
                      className='mt-0.5 text-xs text-red-600/80'
                    />
                  </div>
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  asChild
                  className='h-7 shrink-0 px-2 text-xs'
                >
                  <Link to={workspaceLabels[task.workspace].href}>
                    去处理 <ArrowRight className='ml-1 size-3' />
                  </Link>
                </Button>
              </div>
            ))}

            {dueSoon.map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50/40 p-2.5 dark:border-amber-950 dark:bg-amber-950/20'
              >
                <div className='flex min-w-0 items-center gap-2.5 pr-2'>
                  <Clock className='size-4 shrink-0 text-amber-600' />
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='h-4 shrink-0 border-amber-300 px-1 py-0 text-[10px] text-amber-700'
                      >
                        {workspaceLabels[task.workspace].name}
                      </Badge>
                      <span className='truncate text-sm font-medium text-amber-900 dark:text-amber-300'>
                        {task.title}
                      </span>
                    </div>
                    <TaskDetail
                      task={task}
                      suffix=' (即将到期)'
                      className='mt-0.5 text-xs text-amber-600/80'
                    />
                  </div>
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  asChild
                  className='h-7 shrink-0 px-2 text-xs'
                >
                  <Link to={workspaceLabels[task.workspace].href}>
                    跟进 <ArrowRight className='ml-1 size-3' />
                  </Link>
                </Button>
              </div>
            ))}

            {normal.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border p-2 text-xs text-muted-foreground'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <Badge
                    variant='secondary'
                    className='h-4 shrink-0 px-1 py-0 text-[10px]'
                  >
                    {workspaceLabels[task.workspace].name}
                  </Badge>
                  <div className='min-w-0'>
                    <span className='block truncate text-foreground'>
                      {task.title}
                    </span>
                    <TaskDetail
                      task={task}
                      className='mt-0.5 text-[11px] text-muted-foreground'
                    />
                  </div>
                </div>
                <Link
                  to={workspaceLabels[task.workspace].href}
                  className='ml-2 flex shrink-0 items-center gap-0.5 hover:text-primary'
                >
                  查看 <ExternalLink className='size-3' />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
