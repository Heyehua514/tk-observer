/** 达人批量状态更新数据源自检。 */
import { describe, expect, it, vi } from 'vitest'
import { bulkUpdateCreatorStatus } from './bulk-update-creators'

describe('bulkUpdateCreatorStatus', () => {
  it('updates Supabase creators by id list', async () => {
    const inFilter = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ in: inFilter }))

    await bulkUpdateCreatorStatus(
      {
        provider: 'supabase',
        supabase: {
          from: () => ({ update }),
        },
      },
      { ids: ['creator-1', 'creator-2'], status: 'signed' }
    )

    expect(update).toHaveBeenCalledWith({ cooperation_status: 'signed' })
    expect(inFilter).toHaveBeenCalledWith('id', ['creator-1', 'creator-2'])
  })
})
