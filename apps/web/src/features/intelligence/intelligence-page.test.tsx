import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { IntelligencePage } from './intelligence-page'

const item = {
  id: 'item-1', title: '公开行业公告', summary: '摘要内容', sourceName: '官方来源',
  sourceType: 'official' as const, sourceUrl: 'https://example.com/news', capturedAt: '2026-08-24T01:00:00.000Z',
  region: '中国', language: 'zh-CN', topic: '行业', heatScore: 80, confidence: 0.9,
  dedupeKey: 'source:item-1', workspaces: ['market'], status: 'unread' as const,
  createdBy: 'owner-1', createdAt: '2026-08-24T01:00:00.000Z',
}

vi.mock('@/features/intelligence/hooks/use-intelligence-items', () => ({
  useIntelligenceItems: () => ({ data: [item], isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdateIntelligenceItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('@/features/intelligence/hooks/use-create-intelligence-item', () => ({
  useCreateIntelligenceItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

it('shows source provenance, status actions, and safe original link', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}><IntelligencePage /></QueryClientProvider>
  )
  await expect.element(screen.getByText('每日情报中心')).toBeInTheDocument()
  await expect.element(screen.getByText('官方公告')).toBeInTheDocument()
  await expect.element(screen.getByText('标记已读')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: '打开原文' })
  await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
})

it('shows required fields in the create dialog', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}><IntelligencePage /></QueryClientProvider>
  )
  await screen.getByRole('button', { name: '新增情报' }).click()
  await expect.element(screen.getByText('原文链接')).toBeInTheDocument()
  await expect.element(screen.getByText('去重键')).toBeInTheDocument()
})
