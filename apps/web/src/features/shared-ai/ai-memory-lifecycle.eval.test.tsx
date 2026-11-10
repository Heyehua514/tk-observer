import { toast } from 'sonner'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AiAssistantPanel } from './ai-assistant-panel'
import { AiMemoryView } from './ai-memory-view'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  gateway: vi.fn(),
  isError: false,
  isRemoving: false,
  data: [] as { id: string; memoryKey: string; memoryValue: string }[],
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; role: string } }) => unknown
  ) => selector({ user: { id: 'owner-1', role: 'business' } }),
}))
vi.mock('@/lib/dify-client', () => ({ searchDifyKnowledge: async () => [] }))
vi.mock('./hooks/use-ai-workspace-context', () => ({
  useAiWorkspaceContext: () => ({
    load: async () => ({ items: [], missingSources: [] }),
  }),
}))
vi.mock('./workbuddy-gateway', () => ({ callWorkBuddyGateway: mocks.gateway }))
vi.mock('./hooks/use-ai-memory', () => ({
  useAiMemory: () => ({
    data: mocks.data,
    isLoading: false,
    isPending: false,
    isSaving: false,
    isRemoving: mocks.isRemoving,
    isError: mocks.isError,
    save: mocks.save,
    remove: mocks.remove,
    refetch: mocks.refetch,
  }),
}))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.gateway.mockResolvedValue('先确认客户预算，再安排下一步。')
  mocks.isError = false
  mocks.isRemoving = false
  mocks.data = []
})

it('preserves analysis after failed confirmation and permits retry without rerunning AI', async () => {
  let rejectSave: (reason: Error) => void = () => {}
  mocks.save
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectSave = reject
        })
    )
    .mockResolvedValueOnce({})
  const screen = await render(
    <AiAssistantPanel scope='商务工作台' initialPrompt='分析商机' />
  )
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()
  await screen.getByRole('button', { name: '记住这条' }).click()
  await expect
    .element(screen.getByRole('button', { name: '正在记住…' }))
    .toBeDisabled()
  await expect
    .element(screen.getByRole('button', { name: /让 WorkBuddy 执行/ }))
    .toBeDisabled()
  expect(mocks.save).toHaveBeenCalledOnce()
  rejectSave(new Error('offline'))
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('记忆保存失败，分析结果已保留，请重试。')
  await expect
    .element(screen.getByText('先确认客户预算，再安排下一步。'))
    .toBeInTheDocument()
  expect(toast.success).not.toHaveBeenCalledWith('已记住这条建议')
  await screen.getByRole('button', { name: '记住这条' }).click()
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('已记住这条建议')
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
  expect(mocks.save).toHaveBeenCalledTimes(2)
  expect(mocks.gateway).toHaveBeenCalledOnce()
})

it('uses the generated result task when the user changes the next task before saving', async () => {
  mocks.save.mockResolvedValue({})
  const screen = await render(
    <AiAssistantPanel scope='商务工作台' initialPrompt='分析商机' />
  )
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()
  await expect
    .element(screen.getByText('先确认客户预算，再安排下一步。'))
    .toBeInTheDocument()
  await screen.getByRole('combobox').click()
  await screen.getByRole('option', { name: '文案', exact: true }).click()
  await screen.getByRole('button', { name: '记住这条' }).click()
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({
      memoryKey: '商务工作台:分析',
      memoryValue: '先确认客户预算，再安排下一步。',
    })
  )
})

it('shows a retryable read error instead of the no-memory empty state', async () => {
  mocks.isError = true
  const screen = await render(<AiMemoryView />)
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('个人记忆读取失败')
  await expect
    .element(screen.getByText('还没有个人记忆'))
    .not.toBeInTheDocument()
  await screen.getByRole('button', { name: '重试读取' }).click()
  expect(mocks.refetch).toHaveBeenCalledOnce()
})

it('keeps the memory visible on failed removal and allows retry', async () => {
  mocks.data = [
    { id: 'memory-1', memoryKey: '商务工作台:分析', memoryValue: '保持跟进' },
  ]
  mocks.remove
    .mockRejectedValueOnce(new Error('denied'))
    .mockResolvedValueOnce(undefined)
  const screen = await render(<AiMemoryView />)
  await screen.getByRole('button', { name: '删除记忆' }).click()
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('记忆删除失败')
  await expect.element(screen.getByText('保持跟进')).toBeInTheDocument()
  expect(toast.success).not.toHaveBeenCalledWith('记忆已删除')
  await screen.getByRole('button', { name: '删除记忆' }).click()
  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith('记忆已删除')
  )
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
})

it('disables removal while the mutation is pending', async () => {
  mocks.data = [
    { id: 'memory-1', memoryKey: '商务工作台:分析', memoryValue: '保持跟进' },
  ]
  mocks.isRemoving = true
  const screen = await render(<AiMemoryView />)
  await expect
    .element(screen.getByRole('button', { name: '删除记忆' }))
    .toBeDisabled()
})
