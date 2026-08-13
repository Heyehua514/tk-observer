/** 场地资源 Supabase 映射层。 */
import type { Venue, VenueInput } from './types'

type Row = Record<string, unknown>

export function mapSupabaseVenue(record: Row): Venue {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    type: record.type as Venue['type'],
    city: String(record.city || ''),
    address: String(record.address || ''),
    capacityMin: Number(record.capacity_min || 0),
    capacityMax: Number(record.capacity_max || 0),
    priceRange: String(record.price_range || ''),
    sceneTags: String(record.scene_tags || ''),
    pros: String(record.pros || ''),
    cons: String(record.cons || ''),
    contactName: String(record.contact_name || ''),
    contactPhone: String(record.contact_phone || ''),
    siteVisitDate: String(record.site_visit_date || ''),
    siteVisitNotes: String(record.site_visit_notes || ''),
    photos: Array.isArray(record.photo_paths)
      ? record.photo_paths.map(String)
      : [],
    isVerified: Boolean(record.is_verified),
    usageCount: Number(record.usage_count || 0),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function serializeSupabaseVenue(input: VenueInput) {
  return {
    name: input.name,
    type: input.type,
    city: input.city,
    address: input.address || null,
    capacity_min: input.capacityMin,
    capacity_max: input.capacityMax,
    price_range: input.priceRange || null,
    scene_tags: input.sceneTags || null,
    pros: input.pros || null,
    cons: input.cons || null,
    contact_name: input.contactName || null,
    contact_phone: input.contactPhone || null,
    site_visit_date: input.siteVisitDate || null,
    site_visit_notes: input.siteVisitNotes || null,
    is_verified: input.isVerified,
  }
}
