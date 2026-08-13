/** 团队记忆错误态文案自检；Supabase-first 后不再提示 PocketBase migration。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TeamMemory } from './team-memory'

vi.mock('./use-team-memory', () => ({
  useTeamMemory: () => ({
    isLoading: false,
    isError: true,
    data: null,
    refetch: vi.fn(),
  }),
}))

it('uses neutral data-service wording when team memory fails to load', async () => {
  const queryClient = new QueryClient()
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <TeamMemory />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('团队记忆暂时无法加载')).toBeInTheDocument()
  await expect
    .element(screen.getByText('请检查数据服务和当前账号权限后重试。'))
    .toBeInTheDocument()
})
