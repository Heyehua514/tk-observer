import { Link } from '@tanstack/react-router'
import { AlertCircle, Clock, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  filterPendingTasks,
  type CrossWorkspaceTask,
} from './cross-workspace-tasks-model'

const workspaceLabels: Record<CrossWorkspaceTask['workspace'], { name: string; href: string }> = {
  design: { name: '设计', href: '/design' },
  editing: { name: '剪辑', href: '/editing' },
  business: { name: '商机', href: '/business' },
}

export function CrossWorkspaceTasks({
  tasks = [],
}: {
  tasks?: CrossWorkspaceTask[]
}) {
  const { overdue, dueSoon, normal } = filterPendingTasks(tasks)
  const totalActionable = overdue.length + dueSoon.length

  return (
    <Card className='bento-card shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <div className='flex items-center gap-2'>
          <CardTitle className='text-base font-semibold'>跨工作台待办与风险</CardTitle>
          {totalActionable > 0 ? (
            <Badge variant='destructive' className='h-5 px-1.5 text-xs'>
              {totalActionable} 项待关注
            </Badge>
          ) : (
            <Badge variant='outline' className='h-5 px-1.5 text-xs text-emerald-600 border-emerald-300'>
              进度正常
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {overdue.length === 0 && dueSoon.length === 0 && normal.length === 0 ? (
          <div className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
            <CheckCircle2 className='size-4 text-emerald-500' />
            <span>所有工作台暂无未完成待办，运转顺畅。</span>
          </div>
        ) : (
          <div className='space-y-3'>
            {/* 逾期风险 */}
            {overdue.map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border border-red-200/60 bg-red-50/40 p-2.5 dark:border-red-950 dark:bg-red-950/20'
              >
                <div className='flex items-center gap-2.5 min-w-0 pr-2'>
                  <AlertCircle className='size-4 shrink-0 text-red-600' />
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='shrink-0 text-[10px] px-1 py-0 h-4 border-red-300 text-red-700'>
                        {workspaceLabels[task.workspace].name}
                      </Badge>
                      <span className='truncate text-sm font-medium text-red-900 dark:text-red-300'>
                        {task.title}
                      </span>
                    </div>
                    {task.dueAt && (
                      <p className='text-xs text-red-600/80 mt-0.5'>
                        截止: {task.dueAt.slice(0, 10)} (已逾期)
                      </p>
                    )}
                  </div>
                </div>
                <Button size='sm' variant='ghost' asChild className='shrink-0 h-7 px-2 text-xs'>
                  <Link to={workspaceLabels[task.workspace].href}>
                    去处理 <ArrowRight className='size-3 ml-1' />
                  </Link>
                </Button>
              </div>
            ))}

            {/* 今日/即将到期 */}
            {dueSoon.map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50/40 p-2.5 dark:border-amber-950 dark:bg-amber-950/20'
              >
                <div className='flex items-center gap-2.5 min-w-0 pr-2'>
                  <Clock className='size-4 shrink-0 text-amber-600' />
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='shrink-0 text-[10px] px-1 py-0 h-4 border-amber-300 text-amber-700'>
                        {workspaceLabels[task.workspace].name}
                      </Badge>
                      <span className='truncate text-sm font-medium text-amber-900 dark:text-amber-300'>
                        {task.title}
                      </span>
                    </div>
                    {task.dueAt && (
                      <p className='text-xs text-amber-600/80 mt-0.5'>
                        截止: {task.dueAt.slice(0, 10)} (即将到期)
                      </p>
                    )}
                  </div>
                </div>
                <Button size='sm' variant='ghost' asChild className='shrink-0 h-7 px-2 text-xs'>
                  <Link to={workspaceLabels[task.workspace].href}>
                    跟进 <ArrowRight className='size-3 ml-1' />
                  </Link>
                </Button>
              </div>
            ))}

            {/* 常规待办精简列举 */}
            {normal.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className='flex items-center justify-between rounded-lg border p-2 text-xs text-muted-foreground'
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <Badge variant='secondary' className='shrink-0 text-[10px] px-1 py-0 h-4'>
                    {workspaceLabels[task.workspace].name}
                  </Badge>
                  <span className='truncate text-foreground'>{task.title}</span>
                </div>
                <Link to={workspaceLabels[task.workspace].href} className='hover:text-primary flex items-center gap-0.5 shrink-0 ml-2'>
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
