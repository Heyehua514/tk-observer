/** 通用 AI 助手面板测试。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AiAssistantPanel } from './ai-assistant-panel'

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  callWorkBuddyGateway: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'business' } }),
}))

vi.mock('@/features/shared-ai/hooks/use-ai-workspace-context', () => ({
  useAiWorkspaceContext: () => ({ load: mocks.load }),
}))

vi.mock('@/features/shared-ai/workbuddy-gateway', () => ({
  callWorkBuddyGateway: mocks.callWorkBuddyGateway,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

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

it('loads workspace data only after the user requests analysis', async () => {
  mocks.load.mockResolvedValue({
    available: true,
    items: [],
    missingSources: [],
  })
  mocks.callWorkBuddyGateway.mockResolvedValue('分析建议')
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel scope='商务工作台' />
    </QueryClientProvider>
  )

  expect(mocks.load).not.toHaveBeenCalled()
  await screen
    .getByPlaceholder(
      '例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
    )
    .fill('分析我的商机')
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()

  await vi.waitFor(() => expect(mocks.load).toHaveBeenCalledOnce())
  expect(mocks.callWorkBuddyGateway).toHaveBeenCalledWith(
    expect.stringContaining('不得声称已经创建任务、修改记录、发送消息')
  )
})
