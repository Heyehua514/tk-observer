import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { IntelligencePage } from './intelligence-page'

const {
  createIntelligenceItem,
  updateIntelligenceItem,
  convertIntelligenceItemToTask,
} = vi.hoisted(() => ({
  createIntelligenceItem: vi.fn(),
  updateIntelligenceItem: vi.fn(),
  convertIntelligenceItemToTask: vi.fn(),
}))

const item = {
  id: 'item-1',
  title: '公开行业公告',
  summary: '摘要内容',
  sourceName: '官方来源',
  sourceType: 'official' as const,
  sourceUrl: 'https://example.com/news',
  capturedAt: '2026-08-24T01:00:00.000Z',
  region: '中国',
  language: 'zh-CN',
  topic: '行业',
  heatScore: 80,
  confidence: 0.9,
  dedupeKey: 'source:item-1',
  workspaces: ['market'],
  status: 'unread' as const,
  createdBy: 'owner-1',
  createdAt: '2026-08-24T01:00:00.000Z',
}

const convertedTask = {
  id: 'task-1',
  title: item.title,
  assigneeName: '测试老板',
  dueAt: '',
  region: 'US',
}

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: { user: { name: string; role: string } }) => unknown
  ) => selector({ user: { name: '测试老板', role: 'owner' } }),
}))
vi.mock('@/features/intelligence/hooks/use-intelligence-items', () => ({
  useIntelligenceItems: () => ({
    data: [item],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateIntelligenceItem: () => ({
    mutateAsync: updateIntelligenceItem,
    isPending: false,
  }),
}))
vi.mock('@/features/intelligence/hooks/use-create-intelligence-item', () => ({
  useCreateIntelligenceItem: () => ({
    mutateAsync: createIntelligenceItem,
    isPending: false,
  }),
}))
vi.mock(
  '@/features/intelligence/hooks/use-convert-intelligence-item-to-task',
  () => ({
    useConvertIntelligenceItemToTask: () => ({
      mutateAsync: convertIntelligenceItemToTask,
      isPending: false,
    }),
  })
)

beforeEach(() => {
  createIntelligenceItem.mockResolvedValue(undefined)
  updateIntelligenceItem.mockResolvedValue(undefined)
  convertIntelligenceItemToTask.mockResolvedValue(convertedTask)
  vi.clearAllMocks()
})

it('shows source provenance, status actions, and safe original link', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <IntelligencePage />
    </QueryClientProvider>
  )
  await expect.element(screen.getByText('每日情报中心')).toBeInTheDocument()
  await expect.element(screen.getByText('官方公告')).toBeInTheDocument()
  await expect.element(screen.getByText('标记已读')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '导入 CSV' }))
    .toBeInTheDocument()
  const link = screen.getByRole('link', { name: '打开原文' })
  await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
})

it('shows required fields in the create dialog', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <IntelligencePage />
    </QueryClientProvider>
  )
  await screen.getByRole('button', { name: '新增情报' }).click()
  await expect.element(screen.getByText('原文链接')).toBeInTheDocument()
  await expect.element(screen.getByText('去重键')).toBeInTheDocument()
})

it('creates a real linked task through the conversion service', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <IntelligencePage />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: '转为任务' }).click()
  await expect
    .element(
      screen.getByText(
        '将创建真实团队任务，并原子标记该情报为已转任务。重复提交不会创建第二项任务。'
      )
    )
    .toBeInTheDocument()
  await screen.getByRole('button', { name: '创建任务' }).click()

  expect(convertIntelligenceItemToTask).toHaveBeenCalledWith({
    id: 'item-1',
    assigneeName: '测试老板',
    dueAt: '',
    region: 'US',
  })
  expect(updateIntelligenceItem).not.toHaveBeenCalled()
})
