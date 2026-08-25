import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { MarketWorkbench } from './market-workbench'

vi.mock('../hooks/use-market-workbench', () => ({
  useMarketWorkbench: (query: string) => query.trim(),
}))

vi.mock('../hooks/use-product-catalog', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../hooks/use-product-catalog')>()
  return {
    ...actual,
    useProductCatalog: (query: string) =>
      query.trim()
        ? { data: [] }
        : {
            data: [
              {
                id: 'p1',
                name: '海景蓝牙音箱',
                category: 'electronics',
                priceMinor: 19900,
                costMinor: 9200,
                marginMinor: 10700,
                marginRate: 53.8,
                currency: 'CNY',
                status: 'active',
                region: 'US',
              },
            ],
          },
  }
})

vi.mock('../competitors', () => ({
  CompetitorsWorkbench: () => (
    <table>
      <tbody>
        <tr>
          <td>霞光社</td>
        </tr>
        <tr>
          <td>白鲸出海</td>
        </tr>
        <tr>
          <td>晚点财经</td>
        </tr>
      </tbody>
    </table>
  ),
  MarketCompetitorSummary: () => (
    <div>
      <div>竞品监测</div>
      <div>0 个公众号</div>
      <div>暂无监测账号</div>
    </div>
  ),
}))

vi.mock('../resources', () => ({
  MarketResourcesWorkbench: () => <div>资源库占位</div>,
}))

vi.mock('../venues', () => ({
  VenuesWorkbench: () => <div>场地库占位</div>,
}))

vi.mock('./market-records', () => ({
  EventsPanel: () => <div>活动排期占位</div>,
}))
vi.mock('@/features/shared-ai', () => ({
  AiAssistantPanel: ({ scope }: { scope: string }) => (
    <div>{`AI 助手入口:${scope}`}</div>
  ),
  TaskAiEntry: () => null,
}))

it('shows competitor monitoring and ad overview instead of empty placeholders', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <MarketWorkbench query='' onQueryChange={vi.fn()} />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('0 个公众号')).toBeInTheDocument()
  await expect.element(screen.getByText('暂无监测账号')).toBeInTheDocument()
  await expect
    .element(screen.getByText('AI 助手入口:市场工作台'))
    .toBeInTheDocument()

  await userEvent.click(screen.getByRole('tab', { name: '投放数据' }))
  await expect.element(screen.getByText('按站点投放数据')).toBeInTheDocument()
  await expect.element(screen.getByText('本月投放')).toBeInTheDocument()
  await expect.element(screen.getByText('8 条')).toBeInTheDocument()
})

it('shows guided empty state when product search has no match', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <MarketWorkbench query='蓝牙音箱' onQueryChange={vi.fn()} />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('没有匹配的商品')).toBeInTheDocument()
  await expect
    .element(screen.getByText('换个关键词试试，确认商品名称、类目或站点拼写。'))
    .toBeInTheDocument()
})
