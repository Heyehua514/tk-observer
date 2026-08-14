/** 市场工作台 Supabase/PocketBase 映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapMarketEventRecord,
  mapMarketRelatedRecord,
  serializeMarketEvent,
  toSupabaseMarketSearch,
} from './market-mappers'

describe('market mappers', () => {
  it('maps Supabase event rows into the existing frontend event shape', () => {
    expect(
      mapMarketEventRecord({
        id: 'event-1',
        name: '金鳞会·厦门闭门沙龙',
        type: 'closed_salon',
        theme: null,
        start_date: '2026-08-20T00:00:00Z',
        location_city: '厦门',
        target_attendees: 80,
        target_sponsorship: 3000000,
        total_budget: 1200000,
        status: 'sponsoring',
        created_at: '2026-08-12T01:00:00Z',
        updated_at: '2026-08-12T02:00:00Z',
      })
    ).toEqual({
      id: 'event-1',
      name: '金鳞会·厦门闭门沙龙',
      type: 'closed_salon',
      theme: '',
      startDate: '2026-08-20T00:00:00Z',
      locationCity: '厦门',
      targetAttendees: 80,
      targetSponsorship: 3000000,
      totalBudget: 1200000,
      status: 'sponsoring',
      created: '2026-08-12T01:00:00Z',
      updated: '2026-08-12T02:00:00Z',
    })
  })

  it('serializes event form fields without changing money units', () => {
    expect(
      serializeMarketEvent({
        name: '金鳞会·深圳私董饭局',
        type: 'private_dinner',
        theme: '',
        startDate: '2026-08-28',
        locationCity: '深圳',
        targetAttendees: 30,
        targetSponsorship: 1000000,
        totalBudget: 300000,
        status: 'preparing',
      })
    ).toMatchObject({
      start_date: '2026-08-28',
      location_city: '深圳',
      target_sponsorship: 1000000,
    })
  })

  it('maps related records across shared event tables', () => {
    expect(
      mapMarketRelatedRecord({
        id: 'task-1',
        status: 'done',
        stage: 'signed',
        amount: 200000,
        completion_pct: 80,
        title: '确认嘉宾名单',
        clients: { company_name: '星图科技', name: '星图' },
      })
    ).toMatchObject({
      id: 'task-1',
      status: 'done',
      stage: 'signed',
      amount: 200000,
      completionPct: 80,
      title: '确认嘉宾名单',
      company: '星图科技',
    })
  })

  it('maps supabase client company column in sponsorship joins', () => {
    expect(
      mapMarketRelatedRecord({
        id: 'sponsor-1',
        stage: 'intent',
        amount: 200000,
        clients: { company: '星图科技', name: '星图' },
      })
    ).toMatchObject({
      id: 'sponsor-1',
      stage: 'intent',
      amount: 200000,
      company: '星图科技',
    })
  })

  it('falls back to client name when company is empty', () => {
    expect(
      mapMarketRelatedRecord({
        id: 'sponsor-2',
        stage: 'intent',
        clients: { company: '', name: '星图' },
      })
    ).toMatchObject({
      id: 'sponsor-2',
      company: '星图',
    })
  })

  it('maps finance template rows with description text', () => {
    expect(
      mapMarketRelatedRecord({
        id: 'finance-1',
        category: 'sponsorship_income',
        type: 'income',
        amount: 0,
        description: '赞助收入',
      })
    ).toMatchObject({
      id: 'finance-1',
      category: 'sponsorship_income',
      type: 'income',
      amount: 0,
      description: '赞助收入',
    })
  })

  it('escapes market search input for Supabase or filters', () => {
    expect(toSupabaseMarketSearch('厦门,沙龙%')).toBe('厦门\\,沙龙\\%')
  })
})
