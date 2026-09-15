import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { IntelligencePage } from './intelligence-page'

const { createIntelligenceItem, updateIntelligenceItem } = vi.hoisted(() => ({
  createIntelligenceItem: vi.fn(),
  updateIntelligenceItem: vi.fn(),
}))

vi.mock('@/features/intelligence/hooks/use-intelligence-items', () => ({
  useIntelligenceItems: () => ({
    data: [
      {
        id: 'eval-item-1',
        title: '平台规则更新',
        summary: '需要运营评估影响。',
        sourceName: '官方来源',
        sourceType: 'official',
        sourceUrl: 'https://example.com/rule',
        capturedAt: '2026-08-24T01:00:00.000Z',
        region: '中国',
        language: 'zh-CN',
        topic: '平台规则',
        heatScore: 90,
        confidence: 0.95,
        dedupeKey: 'official:rule-1',
        workspaces: ['operations'],
        status: 'unread',
        createdBy: 'owner-1',
        createdAt: '2026-08-24T01:00:00.000Z',
      },
    ],
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

beforeEach(() => {
  createIntelligenceItem.mockResolvedValue(undefined)
  updateIntelligenceItem.mockResolvedValue(undefined)
  vi.clearAllMocks()
})

it('records task intent without pretending to create a business task', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <IntelligencePage />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: '转为任务' }).click()
  await expect
    .element(
      screen.getByText('当前版本只记录转任务意图，不会自动创建业务任务。')
    )
    .toBeInTheDocument()
  await screen.getByRole('button', { name: '确认记录' }).click()

  expect(updateIntelligenceItem).toHaveBeenCalledWith({
    id: 'eval-item-1',
    status: 'tasked',
  })
  expect(createIntelligenceItem).not.toHaveBeenCalled()
})
