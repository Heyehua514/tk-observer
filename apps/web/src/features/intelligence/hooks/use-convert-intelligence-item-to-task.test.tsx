import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useConvertIntelligenceItemToTask } from './use-convert-intelligence-item-to-task'
import { intelligenceKeys } from './use-intelligence-items'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))
vi.mock('@/lib/pocketbase', () => ({
  pb: { collection: vi.fn() },
}))
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ rpc }),
}))

function ConversionHarness() {
  const convert = useConvertIntelligenceItemToTask()
  const [createdTitle, setCreatedTitle] = useState('')

  return (
    <>
      <button
        type='button'
        onClick={() => {
          void convert
            .mutateAsync({
              id: 'item-1',
              assigneeName: '  测试老板  ',
              dueAt: '2026-11-15T10:00:00.000Z',
              region: 'US',
            })
            .then((task) => setCreatedTitle(task.title))
        }}
      >
        创建团队任务
      </button>
      <p>{createdTitle}</p>
    </>
  )
}

beforeEach(() => {
  rpc.mockResolvedValue({
    data: {
      id: 'task-1',
      title: '公开行业公告',
      assignee_name: '测试老板',
      due_at: '2026-11-15T10:00:00+00:00',
      region: 'US',
      source_intelligence_id: 'item-1',
    },
    error: null,
  })
  vi.clearAllMocks()
})

it('calls the atomic conversion RPC and invalidates affected views', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ConversionHarness />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: '创建团队任务' }).click()

  await vi.waitFor(() => {
    expect(rpc).toHaveBeenCalledWith('convert_intelligence_item_to_task', {
      p_intelligence_item_id: 'item-1',
      p_assignee_name: '测试老板',
      p_due_at: '2026-11-15T10:00:00.000Z',
      p_region: 'US',
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: intelligenceKeys.all,
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['overview-dashboard'],
    })
  })
  await expect.element(screen.getByText('公开行业公告')).toBeInTheDocument()
})
