/** 场地资源 Supabase 映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseVenue,
  serializeSupabaseVenue,
} from './venue-supabase-mapper'

describe('venue Supabase mapper', () => {
  it('maps venue rows with photo paths', () => {
    expect(
      mapSupabaseVenue({
        id: 'venue-1',
        name: '厦门海景酒店',
        type: 'hotel',
        city: '厦门',
        address: null,
        capacity_min: 30,
        capacity_max: 100,
        price_range: null,
        scene_tags: '海景,LED',
        pros: null,
        cons: null,
        contact_name: null,
        contact_phone: null,
        site_visit_date: null,
        site_visit_notes: null,
        photo_paths: ['venue-photos/a.png'],
        is_verified: true,
        usage_count: 2,
        created_at: '2026-08-13T01:00:00Z',
        updated_at: '2026-08-13T02:00:00Z',
      })
    ).toMatchObject({
      id: 'venue-1',
      photos: ['venue-photos/a.png'],
      isVerified: true,
      usageCount: 2,
    })
  })

  it('serializes venue input without photos', () => {
    expect(
      serializeSupabaseVenue({
        name: '厦门海景酒店',
        type: 'hotel',
        city: '厦门',
        address: '',
        capacityMin: 30,
        capacityMax: 100,
        priceRange: '',
        sceneTags: '海景,LED',
        pros: '',
        cons: '',
        contactName: '',
        contactPhone: '',
        siteVisitDate: '',
        siteVisitNotes: '',
        isVerified: true,
      })
    ).toMatchObject({
      capacity_min: 30,
      capacity_max: 100,
      is_verified: true,
    })
  })
})
