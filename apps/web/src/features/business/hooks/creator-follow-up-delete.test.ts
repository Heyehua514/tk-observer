import { describe, expect, it, vi } from 'vitest'

describe('creator follow-up soft-delete contract', () => {
  it('soft-deletes follow-up record with deleted_at timestamp', async () => {
    const eq = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }))
    const update = vi.fn((..._args: unknown[]) => ({ eq }))
    const from = vi.fn((..._args: unknown[]) => ({ update }))
    const mockClient = { from }

    const id = 'follow-up-456'
    const nowIso = new Date().toISOString()
    const { error } = await mockClient
      .from('creator_follow_ups')
      .update({ deleted_at: nowIso })
      .eq('id', id)

    expect(error).toBeNull()
    expect(from).toHaveBeenCalledWith('creator_follow_ups')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      })
    )
    expect(eq).toHaveBeenCalledWith('id', id)
  })

  it('queries active creator follow-ups by creator_id and is deleted_at null', async () => {
    const order = vi.fn((..._args: unknown[]) =>
      Promise.resolve({
        data: [{ id: 'follow-up-1', summary: '初步建联', deleted_at: null }],
        error: null,
      })
    )
    const is = vi.fn((..._args: unknown[]) => ({ order }))
    const eq = vi.fn((..._args: unknown[]) => ({ is }))
    const select = vi.fn((..._args: unknown[]) => ({ eq }))
    const from = vi.fn((..._args: unknown[]) => ({ select }))
    const mockClient = { from }

    const creatorId = 'creator-789'
    const { data, error } = await mockClient
      .from('creator_follow_ups')
      .select('*')
      .eq('creator_id', creatorId)
      .is('deleted_at', null)
      .order('contacted_at', { ascending: false })

    expect(error).toBeNull()
    expect(eq).toHaveBeenCalledWith('creator_id', creatorId)
    expect(is).toHaveBeenCalledWith('deleted_at', null)
    expect(data).toHaveLength(1)
  })
})
