/** 商务朋友圈计划 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapSocialPlanRecord, serializeSocialPlanDraft } from './social-plan-mapper'

describe('social plan mapper', () => {
  it('maps Supabase social plan rows into the existing frontend shape', () => {
    expect(
      mapSocialPlanRecord({
        id: 's1',
        date: '2026-08-12T00:00:00Z',
        content: '发布商单案例',
        target_audience: '品牌方',
        status: 'planned',
      })
    ).toEqual({
      id: 's1',
      date: '2026-08-12T00:00:00Z',
      content: '发布商单案例',
      target: '品牌方',
      status: 'planned',
    })
  })

  it('serializes form draft with a stable start-of-day timestamp', () => {
    expect(
      serializeSocialPlanDraft({
        date: '2026-08-12',
        content: '发布商单案例',
        target_audience: '品牌方',
        expected_outcome: '引导咨询',
      })
    ).toMatchObject({
      date: '2026-08-12 00:00:00.000Z',
      content: '发布商单案例',
      target_audience: '品牌方',
      expected_outcome: '引导咨询',
      status: 'planned',
    })
  })
})
