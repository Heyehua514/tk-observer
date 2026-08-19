/** AI 分析面板：验证授权弹窗在确认前不调用 WorkBuddy。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VideoAiPanel } from './video-ai-panel'

vi.mock('@/lib/data-provider', () => ({ getDataProvider: () => 'supabase' }))
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({ is: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
    }),
    rpc: () => ({}),
  }),
}))
vi.mock('@/lib/pocketbase', () => ({ pb: {} }))

it('renders panel and consent flow', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <VideoAiPanel />
    </QueryClientProvider>
  )
  await expect.element(screen.getByText('视频 AI 分析（WorkBuddy）')).toBeInTheDocument()
  await expect.element(screen.getByRole('button', { name: '开始分析' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '开始分析' }))
  await expect.element(screen.getByText('调用 AI 分析')).toBeInTheDocument()
  await expect
    .element(screen.getByText(/会消耗你的 WorkBuddy 额度/))
    .toBeInTheDocument()
})
