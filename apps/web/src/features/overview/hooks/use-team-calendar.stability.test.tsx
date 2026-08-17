/**
 * 团队日历查询键稳定性回归测试。
 * 用途：验证高频重渲染（顶部时钟、指标动画等）不会因 queryKey 含毫秒时间戳
 * 而让 React Query 无限重新请求（该 Bug 已在 E2E 中实测复现：/rest/v1/ 每分钟数百次）。
 * 所属工作台：总览（磊哥）；权限：boss 只读。
 */
import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TeamCalendar } from '../components/team-calendar'

const fetchCounts = vi.hoisted(() => new Map<string, number>())

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      fetchCounts.set(table, (fetchCounts.get(table) ?? 0) + 1)
      return {
        select: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }
    },
  }),
}))

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: vi.fn().mockResolvedValue([]),
    }),
  },
}))

function Ticker({ children }: { children: ReactNode }) {
  const [, setTick] = useState(0)
  return (
    <div>
      <button onClick={() => setTick((tick) => tick + 1)}>强制重渲染</button>
      {children}
    </div>
  )
}

it('团队日历在高频重渲染下每个表只请求一次', async () => {
  fetchCounts.clear()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <Ticker>
        <TeamCalendar />
      </Ticker>
    </QueryClientProvider>
  )

  // 数据解析完成后出现空态引导文案，说明首轮查询已完成。
  await expect.element(screen.getByText('还没有团队排期')).toBeInTheDocument()

  // 连续强制重渲染 5 次：若 queryKey 不稳定，每次都会触发新请求。
  const button = screen.getByRole('button', { name: '强制重渲染' })
  for (let index = 0; index < 5; index += 1) {
    await button.click()
  }

  await expect.element(screen.getByText('还没有团队排期')).toBeInTheDocument()

  for (const table of [
    'events',
    'event_tasks',
    'design_requirements',
    'social_plans',
    'channel_orders',
  ]) {
    expect(fetchCounts.get(table), `表 ${table} 应只请求一次`).toBe(1)
  }
})
