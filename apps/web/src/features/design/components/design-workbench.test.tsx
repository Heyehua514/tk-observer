/** 设计工作台品牌规范统计 UI 测试。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { DesignWorkbench } from './design-workbench'

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'design' } }),
}))
vi.mock('@/features/shared-ai', () => ({
  AiAssistantPanel: ({ scope }: { scope: string }) => (
    <div>{`AI 助手入口:${scope}`}</div>
  ),
  TaskAiEntry: () => null,
}))

it('品牌规范展示设计资产、待审素材和已交付需求统计', async () => {
  const params = {
    query: '',
    status: 'all' as const,
    region: 'all' as const,
    sort: '-updated' as const,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(
    ['design-assets', 'list', params],
    [
      { id: 'asset-1', status: 'approved' },
      { id: 'asset-2', status: 'pending_review' },
      { id: 'asset-3', status: 'pending_review' },
    ]
  )
  queryClient.setQueryData(
    ['design', 'requirements', 'all'],
    [
      {
        id: 'requirement-1',
        title: '已交付主KV',
        description: '',
        requester: 'boss-user',
        targetSize: '',
        usageScene: '',
        copyContent: '',
        deliveryFormat: '',
        referenceUrls: '',
        status: 'delivered',
        priority: '中',
        dueDate: '2026-08-20',
        created: '2026-08-17',
      },
      {
        id: 'requirement-2',
        title: '制作中海报',
        description: '',
        requester: 'boss-user',
        targetSize: '',
        usageScene: '',
        copyContent: '',
        deliveryFormat: '',
        referenceUrls: '',
        status: 'in_progress',
        priority: '中',
        dueDate: '2026-08-21',
        created: '2026-08-17',
      },
    ]
  )
  queryClient.setQueryData(['design', 'tasks'], [])
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <DesignWorkbench params={params} onParamsChange={vi.fn()} />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('tab', { name: '品牌规范' }))

  await expect.element(screen.getByText('设计资产')).toBeInTheDocument()
  await expect
    .element(screen.getByText('AI 助手入口:设计工作台'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByTestId('metric-motion-0').getByText('3'))
    .toBeInTheDocument()
  await expect.element(screen.getByText('待审核素材')).toBeInTheDocument()
  await expect
    .element(screen.getByTestId('metric-motion-1').getByText('2'))
    .toBeInTheDocument()
  await expect.element(screen.getByText('已交付需求')).toBeInTheDocument()
  await expect
    .element(screen.getByTestId('metric-motion-2').getByText('1'))
    .toBeInTheDocument()
})
