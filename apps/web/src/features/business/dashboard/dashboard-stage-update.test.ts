/** 商务驾驶舱快捷阶段流转数据源自检。 */
import { describe, expect, it, vi } from 'vitest'
import { updateDashboardOpportunityStage } from './dashboard-stage-update'

describe('updateDashboardOpportunityStage', () => {
  it('updates Supabase opportunities with stage probability patch', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))
    await updateDashboardOpportunityStage(
      {
        provider: 'supabase',
        supabase: {
          from: () => ({ update }),
        },
      },
      { id: 'opportunity-1', stage: 'proposal' }
    )

    expect(update).toHaveBeenCalledWith({
      stage: 'proposal',
      probability: 30,
      lost_reason: null,
    })
  })
})
