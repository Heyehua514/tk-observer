/** 市场工作台数据库映射层：兼容 Supabase/PocketBase 行结构。 */
import type { ActivityRelatedRecord } from '../activities/types'
import type { Event, EventInput, Venue, VenueInput } from '../types'

export function toSupabaseMarketSearch(value: string) {
  return value.trim().replace(/%/g, '\\%').replace(/,/g, '\\,')
}

export function mapMarketEventRecord(record: Record<string, unknown>): Event {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    type: record.type as Event['type'],
    theme: String(record.theme || ''),
    startDate: String(record.start_date || ''),
    locationCity: String(record.location_city || ''),
    targetAttendees: Number(record.target_attendees || 0),
    targetSponsorship: Number(record.target_sponsorship || 0),
    totalBudget: Number(record.total_budget || 0),
    status: record.status as Event['status'],
    created: String(record.created_at || record.created || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function mapMarketVenueRecord(record: Record<string, unknown>): Venue {
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
    isVerified: Boolean(record.is_verified),
    usageCount: Number(record.usage_count || 0),
    created: String(record.created_at || record.created || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function serializeMarketEvent(input: EventInput) {
  return {
    name: input.name,
    type: input.type,
    theme: input.theme,
    start_date: input.startDate,
    location_city: input.locationCity,
    target_attendees: input.targetAttendees,
    target_sponsorship: input.targetSponsorship,
    total_budget: input.totalBudget,
    status: input.status,
  }
}

export function serializeMarketVenue(input: VenueInput) {
  return {
    name: input.name,
    type: input.type,
    city: input.city,
    address: input.address,
    capacity_min: input.capacityMin,
    capacity_max: input.capacityMax,
    price_range: input.priceRange,
    scene_tags: input.sceneTags,
    pros: input.pros,
    cons: input.cons,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    site_visit_date: input.siteVisitDate,
    site_visit_notes: input.siteVisitNotes,
    is_verified: input.isVerified,
  }
}

export function mapMarketRelatedRecord(
  item: Record<string, unknown>
): ActivityRelatedRecord {
  const clients =
    item.clients && typeof item.clients === 'object'
      ? (item.clients as Record<string, unknown>)
      : undefined
  return {
    id: String(item.id || ''),
    status: typeof item.status === 'string' ? item.status : undefined,
    stage: typeof item.stage === 'string' ? item.stage : undefined,
    type: typeof item.type === 'string' ? item.type : undefined,
    amount: typeof item.amount === 'number' ? item.amount : undefined,
    completionPct:
      typeof item.completion_pct === 'number' ? item.completion_pct : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    name: typeof item.name === 'string' ? item.name : undefined,
    company:
      typeof item.company === 'string'
        ? item.company
        : typeof clients?.company === 'string' && clients.company
          ? clients.company
          : typeof clients?.company_name === 'string' && clients.company_name
            ? clients.company_name
            : typeof clients?.name === 'string' && clients.name
              ? clients.name
              : undefined,
    position: typeof item.position === 'string' ? item.position : undefined,
    category: typeof item.category === 'string' ? item.category : undefined,
    description:
      typeof item.description === 'string' ? item.description : undefined,
    notes: typeof item.notes === 'string' ? item.notes : undefined,
  }
}
