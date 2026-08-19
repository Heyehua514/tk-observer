/** 总览首页 UI 自检；验证空态和指标对比文案更像正在使用的系统。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { OverviewDashboard } from './overview-dashboard'

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    channel: () => ({ on: () => ({ subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }) }),
    removeChannel: vi.fn(),
    from: (table: string) => ({
      select: (
        _columns?: string,
        options?: { count?: string; head?: boolean }
      ) => ({
        eq: () => ({
          is: () => Promise.resolve({ data: null, error: null, count: 0 }),
        }),
        lt: () => ({
          is: () => Promise.resolve({ data: null, error: null, count: 0 }),
        }),
        is: () => ({
          order: () =>
            table === 'events'
              ? {
                  range: vi.fn().mockResolvedValue({ data: [], error: null }),
                }
              : table === 'audit_logs'
                ? {
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }
                : Promise.resolve({
                    data: [],
                    error: null,
                    count: options?.head ? 0 : null,
                  }),
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: vi.fn().mockResolvedValue([]),
      getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    }),
  },
}))

it('renders guided empty states for overview dashboard data gaps', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OverviewDashboard />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('等待团队动态沉淀')).toBeInTheDocument()
  await expect
    .element(screen.getByText('成员开始维护业务数据后，操作记录会显示在这里。'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('等待下一条数据').first())
    .toBeInTheDocument()
  await expect
    .element(
      screen.getByText('统一人民币口径：金额以分存储，前端按人民币元展示。')
    )
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('还没有即将开始的活动'))
    .toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: '近 7 天' }))
  await expect.element(screen.getByText('近 7 天 GMV')).toBeInTheDocument()
})
