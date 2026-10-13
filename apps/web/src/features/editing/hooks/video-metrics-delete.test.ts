import { describe, expect, it, vi } from 'vitest'

describe('video metrics log soft-delete contract', () => {
  it('soft-deletes video metrics log record by setting deleted_at', async () => {
    const eq = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }))
    const update = vi.fn((..._args: unknown[]) => ({ eq }))
    const from = vi.fn((..._args: unknown[]) => ({ update }))
    const mockClient = { from }

    const id = 'metrics-log-789'
    const nowIso = new Date().toISOString()
    const { error } = await mockClient
      .from('video_metrics_logs')
      .update({ deleted_at: nowIso })
      .eq('id', id)

    expect(error).toBeNull()
    expect(from).toHaveBeenCalledWith('video_metrics_logs')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      })
    )
    expect(eq).toHaveBeenCalledWith('id', id)
  })

  it('queries active metrics logs for video filtering out soft-deleted records', async () => {
    const order = vi.fn((..._args: unknown[]) =>
      Promise.resolve({
        data: [{ id: 'metrics-active', video_id: 'vid-1', views: 5000, deleted_at: null }],
        error: null,
      })
    )
    const is = vi.fn((..._args: unknown[]) => ({ order }))
    const eq = vi.fn((..._args: unknown[]) => ({ is }))
    const select = vi.fn((..._args: unknown[]) => ({ eq }))
    const from = vi.fn((..._args: unknown[]) => ({ select }))
    const mockClient = { from }

    const videoId = 'vid-1'
    const { data, error } = await mockClient
      .from('video_metrics_logs')
      .select('*')
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .order('logged_at', { ascending: false })

    expect(error).toBeNull()
    expect(eq).toHaveBeenCalledWith('video_id', videoId)
    expect(is).toHaveBeenCalledWith('deleted_at', null)
    expect(data).toHaveLength(1)
    expect(data?.[0]?.views).toBe(5000)
  })
})
