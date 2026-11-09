import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
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

it('never describes unconfirmed suggestions as completed system actions', async () => {
  mocks.load.mockResolvedValue({
    available: true,
    items: [{ kind: '商机', title: '待跟进客户', status: '跟进中' }],
    missingSources: [],
  })
  mocks.callWorkBuddyGateway.mockResolvedValue('先确认客户预算，再安排下一步。')

  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel scope='商务工作台' />
    </QueryClientProvider>
  )

  await screen
    .getByPlaceholder(
      '例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
    )
    .fill('给我商机建议')
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()

  await vi.waitFor(() =>
    expect(mocks.callWorkBuddyGateway).toHaveBeenCalledWith(
      expect.stringContaining('不得声称已经创建任务、修改记录、发送消息')
    )
  )
})

it('explains channel failure without exposing developer commands', async () => {
  mocks.load.mockResolvedValue({
    available: true,
    items: [],
    missingSources: [],
  })
  mocks.callWorkBuddyGateway.mockRejectedValue(new Error('GATEWAY_UNAVAILABLE'))
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel scope='商务工作台' />
    </QueryClientProvider>
  )

  await screen
    .getByPlaceholder(
      '例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
    )
    .fill('分析我的商机')
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()

  await vi.waitFor(() => expect(toast.error).toHaveBeenCalledOnce())
  const message = vi.mocked(toast.error).mock.calls[0]?.[0]
  expect(message).toContain('WorkBuddy')
  expect(message).not.toContain('.command')
})

it('shows a recoverable login error and preserves partial-context warnings on retry', async () => {
  mocks.load.mockResolvedValue({
    available: true,
    items: [],
    missingSources: ['商机'],
  })
  mocks.callWorkBuddyGateway
    .mockRejectedValueOnce(new Error('AI_AUTH_REQUIRED'))
    .mockResolvedValueOnce('请先补充商机数据，再制定跟进计划。')
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel scope='商务工作台' initialPrompt='分析我的商机' />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('登录状态已失效')
  await expect
    .element(screen.getByRole('button', { name: /让 WorkBuddy 执行/ }))
    .toBeEnabled()
  await expect
    .element(screen.getByText(/数据暂不可用，本次建议不会把缺失数据视为零/))
    .toBeInTheDocument()
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()

  await expect
    .element(screen.getByText('请先补充商机数据，再制定跟进计划。'))
    .toBeInTheDocument()
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
  expect(mocks.callWorkBuddyGateway).toHaveBeenCalledTimes(2)
  expect(mocks.callWorkBuddyGateway.mock.calls[1][0]).toContain('商机')
})
