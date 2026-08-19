import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SearchResultsPage } from './index'

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'boss' } }),
}))

vi.mock('@/components/shared/global-search-core', () => ({
  runGlobalSearch: vi.fn(async () => [
    { kind: 'creator', title: '达人', total: 8, items: [{ id: 'c1', kind: 'creator', label: '跨境班长', description: 'US · 128000 粉丝', }] },
  ]),
}))

it('renders grouped results with totals and item rows', async () => {
  const screen = await render(
    <QueryClientProvider client={qc}>
      <SearchResultsPage query="跨境" kind="creator" />
    </QueryClientProvider>
  )
  await expect.element(screen.getByText('达人 · 共 8 条')).toBeInTheDocument()
  await expect.element(screen.getByText('跨境班长')).toBeInTheDocument()
})

it('shows an empty-state when no query is provided', async () => {
  const screen = await render(
    <QueryClientProvider client={qc}>
      <SearchResultsPage query="" kind={undefined} />
    </QueryClientProvider>
  )
  await expect.element(screen.getByText('输入至少两个字开始搜索')).toBeInTheDocument()
})
