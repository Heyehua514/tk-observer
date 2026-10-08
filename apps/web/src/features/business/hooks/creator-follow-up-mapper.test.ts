/** 达人触达跟进记录映射与序列化单元测试。 */
import { describe, expect, it } from 'vitest'
import {
  mapCreatorFollowUp,
  serializeCreatorFollowUp,
} from './creator-follow-up-mapper'

describe('creator follow up mapper', () => {
  it('maps Supabase creator_follow_ups row into frontend model', () => {
    const row = {
      id: 'follow-1',
      creator_id: 'creator-99',
      channel: 'whatsapp',
      status: 'contacting',
      summary: '初次建联，达人表示对个护小家电感兴趣，索要样品。',
      contacted_at: '2026-10-08T08:30:00.000Z',
      next_follow_up_at: '2026-10-12T10:00:00.000Z',
      operator_name: '董雨辰',
      created_at: '2026-10-08T08:31:00.000Z',
      updated_at: '2026-10-08T08:31:00.000Z',
    }

    expect(mapCreatorFollowUp(row)).toEqual({
      id: 'follow-1',
      creatorId: 'creator-99',
      channel: 'whatsapp',
      status: 'contacting',
      summary: '初次建联，达人表示对个护小家电感兴趣，索要样品。',
      contactedAt: '2026-10-08T08:30:00.000Z',
      nextFollowUpAt: '2026-10-12T10:00:00.000Z',
      operatorName: '董雨辰',
      created: '2026-10-08T08:31:00.000Z',
      updated: '2026-10-08T08:31:00.000Z',
    })
  })

  it('provides safe defaults when optional fields are missing', () => {
    const partial = {
      id: 'follow-2',
      creator_id: 'creator-100',
      summary: '已寄送样品，等待签收反馈',
    }

    const mapped = mapCreatorFollowUp(partial)
    expect(mapped.channel).toBe('whatsapp')
    expect(mapped.status).toBe('contacting')
    expect(mapped.operatorName).toBe('董雨辰')
    expect(mapped.nextFollowUpAt).toBeUndefined()
    expect(mapped.summary).toBe('已寄送样品，等待签收反馈')
  })

  it('serializes frontend follow up input into Supabase payload', () => {
    const payload = serializeCreatorFollowUp({
      creatorId: 'creator-99',
      channel: 'email',
      status: 'signed',
      summary: '寄送合同已盖章回传，合作落地',
      contactedAt: '2026-10-08T09:00:00.000Z',
      nextFollowUpAt: '2026-10-15T15:00:00.000Z',
      operatorName: '董雨辰',
    })

    expect(payload).toEqual({
      creator_id: 'creator-99',
      channel: 'email',
      status: 'signed',
      summary: '寄送合同已盖章回传，合作落地',
      contacted_at: '2026-10-08T09:00:00.000Z',
      next_follow_up_at: '2026-10-15T15:00:00.000Z',
      operator_name: '董雨辰',
    })
  })
})
