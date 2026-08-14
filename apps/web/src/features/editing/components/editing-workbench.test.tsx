/** 剪辑工作台 UI 测试：发布排期空态必须是引导式结构，有数据时展示列表。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import type { EditingSearchParams } from '../types'
import { EditingWorkbench } from './editing-workbench'
import type { PublishScheduleItem } from './production-model'

const schedulesState = vi.hoisted(() => ({ value: [] as PublishScheduleItem[] }))

vi.mock('@/features/editing/hooks/use-video-idea-analytics', () => ({
  useVideoIdeaAnalytics: () => ({ data: undefined }),
}))

vi.mock('@/features/editing/hooks/use-video-tasks', () => ({
  useVideoTasks: () => ({ data: [] }),
}))

vi.mock('@/features/editing/hooks/use-video-archive', () => ({
  useVideoArchive: () => ({ data: [] }),
}))

vi.mock('@/features/editing/hooks/use-publish-schedules', () => ({
  publishScheduleKeys: { all: ['publish-schedules'] },
  usePublishSchedules: () => ({ data: schedulesState.value }),
}))

vi.mock('@/features/editing/components/video-idea-form', () => ({
  VideoIdeaFormDialog: () => null,
}))

vi.mock('@/features/editing/components/video-idea-table', () => ({
  VideoIdeaTable: () => <div>选题表格占位</div>,
}))

vi.mock('@/features/editing/components/idea-analytics', () => ({
  IdeaAnalytics: () => <div>数据分析占位</div>,
}))

vi.mock('@/features/editing/components/competitor-workbench', () => ({
  CompetitorWorkbench: () => <div>对标分析占位</div>,
}))

vi.mock('@/features/editing/components/trending-workbench', () => ({
  TrendingWorkbench: () => <div>热点追踪占位</div>,
}))

const params: EditingSearchParams = {
  page: 1,
  perPage: 20,
  query: '',
  account: 'all',
  videoType: 'all',
  tag: '',
  dateFrom: '',
  dateTo: '',
  viral: 'all',
  sort: '-views',
  section: 'production',
  tab: 'list',
}

beforeEach(() => {
  schedulesState.value = []
})

it('发布排期 Tab 展示引导式空态', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <EditingWorkbench params={params} onParamsChange={vi.fn()} />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('tab', { name: '发布排期' }))
  await expect.element(screen.getByText('等待发布排期沉淀')).toBeInTheDocument()
  await expect
    .element(screen.getByText('后续按北京时间和站点当地时间双重标注，按账号展示周排期日历。'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '新建排期' }))
    .toBeEnabled()
})

it('发布排期有数据时展示列表与新建入口', async () => {
  schedulesState.value = [
    {
      id: 'schedule-1',
      title: '厦门切片',
      subtitle: '微信视频号 · CN',
      account: 'TK观察磊哥',
      platform: '微信视频号',
      publishAt: '2026-08-12',
      status: 'scheduled',
    },
  ]
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <EditingWorkbench params={params} onParamsChange={vi.fn()} />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('tab', { name: '发布排期' }))
  await expect.element(screen.getByText('厦门切片')).toBeInTheDocument()
  await expect.element(screen.getByText('微信视频号 · CN')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '新建排期' }))
    .toBeEnabled()
})
