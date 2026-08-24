/**
 * 剪辑工作台主体：微信视频号爆款选题、对标分析、热点追踪和制作骨架。
 * 路由：/editing；权限：editing, boss。
 */
import { useState } from 'react'
import {
  CalendarClock,
  Clapperboard,
  Flame,
  ListVideo,
  Radar,
  SearchCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadStateError } from '@/components/shared/load-state-error'
import { PageHeader } from '@/components/shared/page-header'
import { AiAssistantPanel } from '@/features/shared-ai'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { useUpdateVideoTask } from '../hooks/use-create-video-task'
import { usePublishSchedules } from '../hooks/use-publish-schedules'
import { useVideoArchive } from '../hooks/use-video-archive'
import { useVideoIdeaAnalytics } from '../hooks/use-video-idea-analytics'
import { useVideoTasks } from '../hooks/use-video-tasks'
import type {
  EditingSearchParams,
  TrendingTopic,
  VideoIdea,
  VideoIdeaInput,
} from '../types'
import { CompetitorWorkbench } from './competitor-workbench'
import { editingEmptyTitles } from './editing-empty-copy'
import { IdeaAnalytics } from './idea-analytics'
import type { VideoTaskItem } from './production-model'
import { PublishScheduleFormDialog } from './publish-schedule-form'
import { PublishScheduleTable } from './publish-schedule-table'
import { TrendingWorkbench } from './trending-workbench'
import { VideoAiPanel } from './video-ai-panel'
import { VideoArchiveUploadDialog } from './video-archive-upload-dialog'
import { VideoIdeaFormDialog } from './video-idea-form'
import { VideoIdeaTable } from './video-idea-table'
import { VideoAccountSyncPanel } from './video-account-sync-panel'
import { VideoTaskFormDialog } from './video-task-form'

function ProductionSkeleton() {
  const tasks = useVideoTasks()
  const archive = useVideoArchive()
  const schedules = usePublishSchedules()
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false)
  const [archiveUploadOpen, setArchiveUploadOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<VideoTaskItem | null>(null)
  const updateTask = useUpdateVideoTask()

  return (
    <Tabs defaultValue='tasks'>
      <TabsList>
        <TabsTrigger value='tasks'>
          <ListVideo className='size-4' />
          视频任务
        </TabsTrigger>
        <TabsTrigger value='archive'>
          <Clapperboard className='size-4' />
          成片归档
        </TabsTrigger>
        <TabsTrigger value='schedule'>
          <CalendarClock className='size-4' />
          发布排期
        </TabsTrigger>
      </TabsList>
      <TabsContent value='tasks' className='mt-5'>
        <div className='mb-4 flex justify-end'>
          <Button
            onClick={() => {
              setEditingTask(null)
              setTaskFormOpen(true)
            }}
          >
            新增任务
          </Button>
        </div>
        {tasks.isLoading ? (
          <TableSkeleton title='正在加载视频任务' rows={4} columns={4} />
        ) : tasks.isError ? (
          <LoadStateError
            title='视频任务加载失败'
            onRetry={() => void tasks.refetch()}
          />
        ) : tasks.data?.length ? (
          <div className='overflow-hidden rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 text-xs tracking-wider text-muted-foreground uppercase'>
                <tr>
                  <th className='px-4 py-3 text-left font-medium'>任务</th>
                  <th className='px-4 py-3 text-left font-medium'>状态</th>
                  <th className='px-4 py-3 text-left font-medium'>截止</th>
                  <th className='px-4 py-3 text-left font-medium'>负责人</th>
                  <th className='px-4 py-3 text-left font-medium'></th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.map((task) => (
                  <tr
                    key={task.id}
                    className='border-t transition-colors hover:bg-primary/5'
                  >
                    <td className='px-4 py-3'>
                      <div className='font-medium'>{task.title}</div>
                      <div className='text-xs text-muted-foreground'>
                        {task.subtitle}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask.mutate({
                            id: task.id,
                            input: { status: e.target.value },
                          })
                        }
                        className='rounded border bg-transparent px-1 py-0.5 text-sm'
                      >
                        {['todo', 'editing', 'review', 'done'].map((st) => (
                          <option key={st} value={st}>
                            {
                              {
                                todo: '待处理',
                                editing: '制作中',
                                review: '待审核',
                                done: '已完成',
                              }[st]
                            }
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className='px-4 py-3'>{task.dueAt || '未填'}</td>
                    <td className='px-4 py-3'>{task.owner}</td>
                    <td className='px-4 py-3 text-right'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                          setEditingTask(task)
                          setTaskFormOpen(true)
                        }}
                      >
                        编辑
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={editingEmptyTitles.tasks}
            description='任务将展示标题、关联商品、关联达人、目标站点、状态、截止日期和负责人。'
          />
        )}
        <VideoTaskFormDialog
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          task={editingTask}
        />
      </TabsContent>
      <TabsContent value='archive' className='mt-5'>
        {archive.data?.length ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {archive.data.map((item) => (
              <article
                key={item.id}
                className='rounded-xl border bg-card/70 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30'
              >
                <div className='font-medium'>{item.title}</div>
                <div className='mt-1 text-sm text-muted-foreground'>
                  {item.subtitle}
                </div>
                <div className='mt-3 text-xs text-muted-foreground'>
                  发布日期 {item.publishAt || '未填'}
                </div>
                {item.fileUrl ? (
                  <video
                    className='mt-3 aspect-video w-full rounded-lg bg-muted'
                    controls
                    preload='metadata'
                    src={item.fileUrl}
                  />
                ) : (
                  <div className='mt-3 text-sm text-muted-foreground'>
                    未配置文件链接
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title='还没有归档成片'
            description='上传后视频文件会存入当前数据服务，并在此支持浏览器内预览。'
            action={
              <Button onClick={() => setArchiveUploadOpen(true)}>
                上传成片
              </Button>
            }
          />
        )}
        <VideoArchiveUploadDialog
          open={archiveUploadOpen}
          onOpenChange={setArchiveUploadOpen}
        />
      </TabsContent>
      <TabsContent value='schedule' className='mt-5'>
        {schedules.data?.length ? (
          <div className='space-y-4'>
            <div className='flex justify-end'>
              <Button onClick={() => setScheduleFormOpen(true)}>
                新建排期
              </Button>
            </div>
            <PublishScheduleTable items={schedules.data} />
          </div>
        ) : (
          <EmptyState
            title={editingEmptyTitles.schedule}
            description='后续按北京时间和站点当地时间双重标注，按账号展示周排期日历。'
            action={
              <Button onClick={() => setScheduleFormOpen(true)}>
                新建排期
              </Button>
            }
          />
        )}
        <PublishScheduleFormDialog
          open={scheduleFormOpen}
          onOpenChange={setScheduleFormOpen}
          schedule={null}
        />
      </TabsContent>
    </Tabs>
  )
}

export function EditingWorkbench({
  params,
  onParamsChange,
}: {
  params: EditingSearchParams
  onParamsChange: (patch: Partial<EditingSearchParams>) => void
}) {
  const analytics = useVideoIdeaAnalytics()
  const [formOpen, setFormOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<VideoIdea | null>(null)
  const [initialValues, setInitialValues] = useState<Partial<VideoIdeaInput>>()
  const openCreate = () => {
    setEditingIdea(null)
    setInitialValues(undefined)
    setFormOpen(true)
  }
  const openEdit = (idea: VideoIdea) => {
    setEditingIdea(idea)
    setInitialValues(undefined)
    setFormOpen(true)
  }
  const convertTopic = (
    _topic: TrendingTopic,
    initial: Partial<VideoIdeaInput>
  ) => {
    onParamsChange({ section: 'ideas', tab: 'list' })
    setEditingIdea(null)
    setInitialValues(initial)
    setFormOpen(true)
  }
  const metrics = analytics.data?.metrics || {
    totalVideos: 0,
    viralCount: 0,
    monthlyNew: 0,
    averageCompletionRate: 0,
  }
  return (
    <div className='space-y-6'>
      <PageHeader
        title='微信视频号内容工作台'
        description='谢洁负责三个视频号账号的选题沉淀、对标分析、热点追踪与剪辑交付。'
      />
      <Tabs
        value={params.section}
        onValueChange={(section) =>
          onParamsChange({
            section: section as EditingSearchParams['section'],
            query: '',
          })
        }
      >
        <TabsList className='h-auto flex-wrap'>
          <TabsTrigger value='ideas'>
            <Flame className='size-4' />
            爆款选题库
          </TabsTrigger>
          <TabsTrigger value='competitors'>
            <Radar className='size-4' />
            对标账号分析
          </TabsTrigger>
          <TabsTrigger value='trends'>
            <SearchCheck className='size-4' />
            热点话题追踪
          </TabsTrigger>
          <TabsTrigger value='production'>
            <Clapperboard className='size-4' />
            视频任务与归档
          </TabsTrigger>
        </TabsList>
        <TabsContent value='ideas' className='mt-5'>
          <Tabs
            value={params.tab}
            onValueChange={(tab) =>
              onParamsChange({ tab: tab as EditingSearchParams['tab'] })
            }
          >
            <TabsList>
              <TabsTrigger value='list'>选题列表</TabsTrigger>
              <TabsTrigger value='analytics'>数据分析</TabsTrigger>
            </TabsList>
            <TabsContent value='list' className='mt-5'>
              <VideoAccountSyncPanel />
              <div className='mt-5'>
              <VideoIdeaTable
                params={params}
                onParamsChange={onParamsChange}
                metrics={metrics}
                onCreate={openCreate}
                onEdit={openEdit}
              />
              </div>
            </TabsContent>
            <TabsContent value='analytics' className='mt-5'>
              <IdeaAnalytics />
              <div className='mt-5'>
                <VideoAiPanel />
              </div>
              <div className='mt-5'>
                <AiAssistantPanel scope='剪辑工作台' />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value='competitors' className='mt-5'>
          <CompetitorWorkbench
            query={params.query}
            onQueryChange={(query) => onParamsChange({ query })}
          />
        </TabsContent>
        <TabsContent value='trends' className='mt-5'>
          <TrendingWorkbench
            query={params.query}
            onQueryChange={(query) => onParamsChange({ query })}
            onConvert={convertTopic}
          />
        </TabsContent>
        <TabsContent value='production' className='mt-5'>
          <ProductionSkeleton />
        </TabsContent>
      </Tabs>
      <VideoIdeaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        idea={editingIdea}
        initialValues={initialValues}
      />
    </div>
  )
}
