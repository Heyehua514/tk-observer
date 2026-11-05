import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useCreateVideoMetricsLog } from './use-create-video-metrics-log'
import { videoArchiveKeys } from './use-video-archive'
import {
  useDeleteVideoMetricsLog,
  videoMetricsKeys,
} from './use-video-metrics-logs'

const { from, insert, update, eq } = vi.hoisted(() => {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn(() => ({ eq }))
  const insert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn((table: string) => {
    if (table !== 'video_metrics_logs') {
      throw new Error(`Unexpected table write: ${table}`)
    }
    return { insert, update }
  })
  return { from, insert, update, eq }
})

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))

vi.mock('@/lib/pocketbase', () => ({
  pb: { collection: vi.fn() },
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ from }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const videoId = '53000000-0000-0000-0000-000000000001'

function MetricsMutationHarness() {
  const createLog = useCreateVideoMetricsLog()
  const deleteLog = useDeleteVideoMetricsLog()

  return (
    <>
      <button
        type='button'
        onClick={() => {
          void createLog.mutateAsync({
            videoId,
            views: 1200,
            likes: 30,
            comments: 4,
            shares: 2,
            completionRate: 48.5,
            conversionGmvCents: 9900,
            orderCount: 3,
          })
        }}
      >
        新增指标日志
      </button>
      <button
        type='button'
        onClick={() => {
          void deleteLog.mutateAsync({ id: 'metrics-log-1', videoId })
        }}
      >
        删除指标日志
      </button>
    </>
  )
}

async function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(videoMetricsKeys.byVideo(videoId), [])
  queryClient.setQueryData(videoArchiveKeys.all, [])
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <MetricsMutationHarness />
    </QueryClientProvider>
  )
  return { screen, invalidateQueries }
}

it('creates a metrics log without client-side overwriting the videos projection', async () => {
  from.mockClear()
  insert.mockClear()
  const { screen, invalidateQueries } = await renderHarness()

  await screen.getByRole('button', { name: '新增指标日志' }).click()

  await vi.waitFor(() => {
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ video_id: videoId, views: 1200 })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: videoArchiveKeys.all,
    })
  })
  expect(from).not.toHaveBeenCalledWith('videos')
})

it('invalidates both metrics timeline and video archive after soft delete', async () => {
  update.mockClear()
  eq.mockClear()
  const { screen, invalidateQueries } = await renderHarness()

  await screen.getByRole('button', { name: '删除指标日志' }).click()

  await vi.waitFor(() => {
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    )
    expect(eq).toHaveBeenCalledWith('id', 'metrics-log-1')
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: videoMetricsKeys.byVideo(videoId),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: videoArchiveKeys.all,
    })
  })
})
