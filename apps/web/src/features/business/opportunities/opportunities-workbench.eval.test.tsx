import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { OpportunitiesWorkbench } from './opportunities-workbench'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: async () => [
        {
          id: 'opportunity-eval',
          title: '移动端详情测试商机',
          client: 'client-eval',
          expand: { client: { name: '情报客户' } },
          amount: 880_000,
          stage: 'contact',
          probability: 30,
          expected_close: '2026-09-01',
          notes: '待首次沟通',
        },
      ],
    }),
  },
}))

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'pocketbase',
  getSupabaseEnvironment: () => ({
    url: 'http://127.0.0.1:54321',
    anonKey: 'local-anon-key',
  }),
}))

vi.mock('../clients', () => ({
  useClients: () => ({ data: [] }),
}))

it('renders anchored opportunity detail content without narrow-screen overflow', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesWorkbench />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByText('移动端详情测试商机'))
  await expect
    .element(screen.getByRole('heading', { name: '概览' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('heading', { name: '跟进记录' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('heading', { name: '关联信息' }))
    .toBeInTheDocument()

  const overflowing = [...document.querySelectorAll<HTMLElement>('*')].filter(
    (element) => element.scrollWidth > element.clientWidth
  )
  expect(overflowing).toEqual([])
})
