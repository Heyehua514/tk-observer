/** 市场资源库 Supabase 映射层。 */
import type {
  EventFinance,
  EventMaterial,
  EventOption,
  EventTemplate,
  FinanceCategory,
  FinanceType,
  MaterialStatus,
  MaterialType,
  TemplateEventType,
  TemplateType,
} from './types'

type JoinedEvent = { events?: { name?: unknown } | null }
type Row = Record<string, unknown> & JoinedEvent
const dateOnly = (value: unknown) => String(value || '').slice(0, 10)
const eventName = (record: JoinedEvent) => String(record.events?.name || '')

export function mapSupabaseResourceEvent(record: Row): EventOption {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    city: String(record.location_city || ''),
    date: dateOnly(record.start_date),
    theme: String(record.theme || ''),
  }
}

export function mapSupabaseEventTemplate(record: Row): EventTemplate {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    type: record.type as TemplateType,
    eventType: record.event_type as TemplateEventType,
    content: String(record.content || ''),
    tags: String(record.tags || ''),
    usageCount: Number(record.usage_count || 0),
    lastUsedAt: String(record.last_used_at || ''),
  }
}

export function mapSupabaseEventMaterial(record: Row): EventMaterial {
  return {
    id: String(record.id || ''),
    eventId: String(record.event_id || ''),
    eventName: eventName(record),
    type: record.type as MaterialType,
    name: String(record.name || ''),
    file: String(record.file_path || ''),
    status: record.status as MaterialStatus,
    notes: String(record.notes || ''),
  }
}

export function mapSupabaseEventFinance(record: Row): EventFinance {
  return {
    id: String(record.id || ''),
    eventId: String(record.event_id || ''),
    eventName: eventName(record),
    category: record.category as FinanceCategory,
    type: record.type as FinanceType,
    amount: Number(record.amount || 0),
    description: String(record.description || ''),
    paidBy: String(record.paid_by || ''),
    paidAt: dateOnly(record.paid_at),
  }
}

export function serializeSupabaseEventFinance(input: {
  eventId: string
  category: FinanceCategory
  type: FinanceType
  amount: number
  description: string
  paidBy: string
  paidAt: string
}) {
  return {
    event_id: input.eventId,
    category: input.category,
    type: input.type,
    amount: input.amount,
    description: input.description,
    paid_by: input.paidBy || null,
    paid_at: input.paidAt || null,
  }
}
