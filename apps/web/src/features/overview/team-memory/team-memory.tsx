/**
 * 总览工作台团队记忆：展示日报、失败教训和自动化闭环指标。
 * 权限：boss 只读。
 */
import {
  ArchiveX,
  BookOpenCheck,
  FileStack,
  Gauge,
  Lightbulb,
  TimerReset,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { EmptyState } from '@/components/shared/empty-state'
import type { TeamMemoryData } from './types'
import { useTeamMemory } from './use-team-memory'

export function TeamMemory() {
  const memory = useTeamMemory()
  if (memory.isLoading) {
    return (
      <div
        aria-label='正在加载团队记忆'
        className='h-72 animate-pulse rounded-lg bg-muted'
      />
    )
  }
  if (memory.isError || !memory.data) {
    return (
      <EmptyState
        title='团队记忆暂时无法加载'
        description='请确认 PocketBase 已应用团队记忆 migration 后重试。'
        action={
          <Button variant='outline' onClick={() => void memory.refetch()}>
            重新加载
          </Button>
        }
      />
    )
  }
  return <TeamMemoryContent data={memory.data} />
}

export function TeamMemoryContent({ data }: { data: TeamMemoryData }) {
  const loopItems = [
    { label: '本周 cron', value: data.loop.cronRuns, icon: TimerReset },
    { label: '模板使用', value: data.loop.templateUses, icon: FileStack },
    { label: '失败沉淀', value: data.loop.failedCases, icon: ArchiveX },
  ]
  return (
    <section className='border-y py-5'>
      <div className='mb-5 flex items-start justify-between gap-4'>
        <div>
          <h2 className='flex items-center gap-2 text-base font-semibold'>
            <BookOpenCheck className='size-5 text-emerald-600' />
            团队记忆
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            把每日执行、失败原因和自动化运行沉淀为可复用经验。
          </p>
        </div>
        <span className='rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
          自动更新
        </span>
      </div>
      <div className='grid gap-6 lg:grid-cols-3 lg:divide-x'>
        <div className='min-w-0 lg:pr-6'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <BookOpenCheck className='size-4 text-blue-600' />
            今日简报
          </h3>
          {data.dailyHighlight ? (
            <div className='mt-4'>
              <p className='text-sm leading-7'>{data.dailyHighlight}</p>
              <p className='mt-3 text-xs text-muted-foreground'>
                {formatDate(data.dailyDate)} 自动生成
              </p>
            </div>
          ) : (
            <p className='mt-4 text-sm leading-6 text-muted-foreground'>
              今日日报尚未生成。18:00 自动汇总后，这里会显示团队执行结果。
            </p>
          )}
        </div>
        <div className='min-w-0 lg:px-6'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <Lightbulb className='size-4 text-amber-500' />
            本月教训
          </h3>
          {data.topLessons.length ? (
            <ol className='mt-3 divide-y'>
              {data.topLessons.map((lesson, index) => (
                <li
                  key={lesson.reason}
                  className='flex items-center gap-3 py-2.5'
                >
                  <span className='flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold'>
                    {index + 1}
                  </span>
                  <span className='min-w-0 flex-1 truncate text-sm'>
                    {lesson.reason}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {lesson.count} 次
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className='mt-4 text-sm leading-6 text-muted-foreground'>
              本月还没有失败案例。商机流失或任务超期后会自动沉淀原因。
            </p>
          )}
        </div>
        <div className='min-w-0 lg:pl-6'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <Gauge className='size-4 text-violet-600' />
            闭环仪表
          </h3>
          <div className='mt-4 grid grid-cols-3 gap-3'>
            {loopItems.map((item) => (
              <div key={item.label} className='min-w-0'>
                <item.icon className='size-4 text-muted-foreground' />
                <div className='mt-2 text-xl font-semibold'>
                  <AnimatedNumber value={item.value} />
                </div>
                <div className='mt-1 truncate text-xs text-muted-foreground'>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '今日'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}
