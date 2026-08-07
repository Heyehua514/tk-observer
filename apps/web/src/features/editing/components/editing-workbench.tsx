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
import { PageHeader } from '@/components/shared/page-header'
import { useVideoIdeaAnalytics } from '../hooks/use-video-idea-analytics'
import type {
  EditingSearchParams,
  TrendingTopic,
  VideoIdea,
  VideoIdeaInput,
} from '../types'
import { CompetitorWorkbench } from './competitor-workbench'
import { IdeaAnalytics } from './idea-analytics'
import { TrendingWorkbench } from './trending-workbench'
import { VideoIdeaFormDialog } from './video-idea-form'
import { VideoIdeaTable } from './video-idea-table'

function ProductionSkeleton() {
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
        <EmptyState
          title='暂无视频任务'
          description='任务将展示标题、关联商品、关联达人、目标站点、状态、截止日期和负责人。'
        />
      </TabsContent>
      <TabsContent value='archive' className='mt-5'>
        <EmptyState
          title='还没有归档成片'
          description='后续上传的视频文件会存入 PocketBase，并在此支持浏览器内预览。'
          action={<Button disabled>上传成片</Button>}
        />
      </TabsContent>
      <TabsContent value='schedule' className='mt-5'>
        <div className='relative min-h-64 rounded-lg border p-6'>
          <div className='absolute top-8 bottom-8 left-10 w-px bg-border' />
          <div className='ml-8 text-sm text-muted-foreground'>
            暂无排期，后续按北京时间和站点当地时间双重标注。
          </div>
        </div>
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
              <VideoIdeaTable
                params={params}
                onParamsChange={onParamsChange}
                metrics={metrics}
                onCreate={openCreate}
                onEdit={openEdit}
              />
            </TabsContent>
            <TabsContent value='analytics' className='mt-5'>
              <IdeaAnalytics />
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
