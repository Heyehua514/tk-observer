import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AiNotesView } from './ai-notes-view'

const { notes, recordAudit } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  notes: [
    {
      id: 'note-1',
      scope: '设计工作台',
      task_type: '分析',
      prompt: '梳理设计任务优先级',
      result: '先处理首页改版。',
      owner_id: 'design-user',
      decision: 'pending',
      decided_at: null as string | null,
      created_at: '2026-08-24T08:00:00.000Z',
    },
  ],
}))

vi.mock('@/lib/data-provider', () => ({ getDataProvider: () => 'supabase' }))

const { currentUser } = vi.hoisted(() => ({
  currentUser: { id: 'design-user', role: 'design' },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; role: string } }) => unknown
  ) => selector({ user: currentUser }),
}))

vi.mock('@/lib/audit', () => ({ recordAudit }))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
    from: () => ({
      select: () => ({
        is: () => ({
          order: () => ({
            limit: async () => ({ data: notes, error: null }),
          }),
        }),
      }),
      update: (values: { decision: string; decided_at: string }) => ({
        eq: async () => {
          notes[0] = { ...notes[0], ...values }
          return { error: null }
        },
      }),
    }),
  }),
}))

it('adopting a pending note marks it adopted without creating a business action', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiNotesView />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('待决策')).toBeInTheDocument()
  await screen.getByRole('button', { name: '采用' }).click()

  await expect.element(screen.getByText('已采用')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '采用' }))
    .not.toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '删除 AI 记录' }))
    .toBeInTheDocument()
  expect(recordAudit).toHaveBeenCalledWith('采用 AI 建议', 'ai_notes', 'note-1')
})

it('shows another member AI note as read-only to the boss', async () => {
  currentUser.id = 'boss-user'
  currentUser.role = 'boss'

  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiNotesView />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('全部成员记录可见')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '采用' }))
    .not.toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '忽略' }))
    .not.toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '删除 AI 记录' }))
    .not.toBeInTheDocument()
})
