/** 市场资源库 Supabase 映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseEventFinance,
  mapSupabaseEventMaterial,
  mapSupabaseEventTemplate,
  mapSupabaseResourceEvent,
  serializeSupabaseEventFinance,
} from './market-resource-supabase-mapper'

describe('market resource Supabase mapper', () => {
  it('maps event option rows', () => {
    expect(
      mapSupabaseResourceEvent({
        id: 'event-1',
        name: '厦门沙龙',
        location_city: '厦门',
        start_date: '2026-08-20T00:00:00Z',
        theme: null,
      })
    ).toMatchObject({ city: '厦门', date: '2026-08-20', theme: '' })
  })

  it('maps templates and materials with joined event names', () => {
    expect(
      mapSupabaseEventTemplate({
        id: 'tpl-1',
        name: '闭门沙龙邀约',
        type: 'invitation',
        event_type: 'closed_salon',
        content: '邀请您参加',
        tags: null,
        usage_count: 2,
        last_used_at: null,
      })
    ).toMatchObject({ eventType: 'closed_salon', usageCount: 2 })

    expect(
      mapSupabaseEventMaterial({
        id: 'mat-1',
        event_id: 'event-1',
        events: { name: '厦门沙龙' },
        type: 'poster',
        name: '活动海报',
        file_path: null,
        status: 'designing',
        notes: null,
      })
    ).toMatchObject({ eventName: '厦门沙龙', file: '', notes: '' })
  })

  it('maps and serializes finance rows', () => {
    expect(
      mapSupabaseEventFinance({
        id: 'fin-1',
        event_id: 'event-1',
        events: { name: '厦门沙龙' },
        category: 'venue',
        type: 'expense',
        amount: 100000,
        description: '场地费',
        paid_by: null,
        paid_at: '2026-08-20T00:00:00Z',
        receipt_path: 'finance-1/invoice.png',
      })
    ).toMatchObject({
      eventName: '厦门沙龙',
      paidAt: '2026-08-20',
      receipt: 'finance-1/invoice.png',
    })

    expect(
      serializeSupabaseEventFinance({
        eventId: 'event-1',
        category: 'venue',
        type: 'expense',
        amount: 100000,
        description: '场地费',
        paidBy: '',
        paidAt: '2026-08-20',
      })
    ).toMatchObject({ event_id: 'event-1', paid_by: null })
  })
})
