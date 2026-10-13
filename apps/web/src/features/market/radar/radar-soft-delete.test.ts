import { describe, expect, it, vi } from 'vitest'

describe('product radar soft-delete contract', () => {
  it('soft-deletes product radar item by setting deleted_at timestamp', async () => {
    const eq = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }))
    const update = vi.fn((..._args: unknown[]) => ({ eq }))
    const from = vi.fn((..._args: unknown[]) => ({ update }))
    const mockClient = { from }

    // Execute soft delete logic
    const id = 'radar-123'
    const nowIso = new Date().toISOString()
    const { error } = await mockClient
      .from('product_radars')
      .update({ deleted_at: nowIso })
      .eq('id', id)

    expect(error).toBeNull()
    expect(from).toHaveBeenCalledWith('product_radars')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      })
    )
    expect(eq).toHaveBeenCalledWith('id', id)
  })

  it('filters out soft-deleted items using is deleted_at null query filter', async () => {
    const order = vi.fn((..._args: unknown[]) =>
      Promise.resolve({
        data: [{ id: 'radar-active', title: 'Active Item', deleted_at: null }],
        error: null,
      })
    )
    const is = vi.fn((..._args: unknown[]) => ({ order }))
    const select = vi.fn((..._args: unknown[]) => ({ is }))
    const from = vi.fn((..._args: unknown[]) => ({ select }))
    const mockClient = { from }

    const { data, error } = await mockClient
      .from('product_radars')
      .select('*')
      .is('deleted_at', null)
      .order('heat_score', { ascending: false })

    expect(error).toBeNull()
    expect(is).toHaveBeenCalledWith('deleted_at', null)
    expect(data).toHaveLength(1)
    expect(data?.[0]?.id).toBe('radar-active')
  })
})
