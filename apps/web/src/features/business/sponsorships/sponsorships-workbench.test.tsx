/** 商务活动招商面板 UI 自检；验证 Supabase-first 空态不会退回纯文字占位。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SponsorshipsWorkbench } from './sponsorships-workbench'

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        is: () => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    }),
  },
}))

it('shows a guided empty state for sponsorship records', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <SponsorshipsWorkbench />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('还没有活动招商记录')).toBeInTheDocument()
  await expect
    .element(screen.getByText('市场录入活动招商后，商务可在这里跟进意向、洽谈、签约和流失状态。'))
    .toBeInTheDocument()
})
