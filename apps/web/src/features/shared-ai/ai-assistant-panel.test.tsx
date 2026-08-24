/** 通用 AI 助手面板测试。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AiAssistantPanel } from './ai-assistant-panel'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'business' } }),
}))

it('renders scope and options', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel scope='商务工作台' />
    </QueryClientProvider>
  )
  await expect
    .element(screen.getByText('AI 助手（WorkBuddy）'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText(/由你本机的 WorkBuddy 执行/))
    .toBeInTheDocument()
  await expect.element(screen.getByText('商务助手')).toBeInTheDocument()
  await expect.element(screen.getByText(/客户跟进/)).toBeInTheDocument()
  await expect.element(screen.getByText('需求描述')).toBeInTheDocument()
  await expect
    .element(
      screen.getByPlaceholder(
        '例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
      )
    )
    .toBeInTheDocument()
})
