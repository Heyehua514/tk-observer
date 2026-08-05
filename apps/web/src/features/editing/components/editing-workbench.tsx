/** 剪辑工作台主体：视频任务、成片归档和发布排期骨架。 */
import { CalendarClock, Clapperboard, ListVideo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchBar } from '@/components/shared/search-bar'
import { useEditingWorkbench } from '../hooks/use-editing-workbench'

export function EditingWorkbench({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (query: string) => void
}) {
  const activeQuery = useEditingWorkbench(query)
  return (
    <div className='space-y-6'>
      <PageHeader
        title='剪辑工作台'
        description='跟踪视频制作任务、成片文件和发布节奏。'
      />
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
          <div className='mb-4 flex items-center justify-between gap-3'>
            <SearchBar
              value={query}
              onChange={onQueryChange}
              placeholder='搜索视频标题、达人或商品'
            />
            {activeQuery && (
              <span className='text-sm text-muted-foreground'>
                搜索：{activeQuery}
              </span>
            )}
          </div>
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
    </div>
  )
}
