/** 商务客户数据库字段映射；兼容 Supabase/PocketBase 行结构。 */
import type { Client, ClientInput } from './types'

export type ClientRecord = {
  id: string
  name?: unknown
  contact_name?: unknown
  contact_phone?: unknown
  contact_wechat?: unknown
  company?: unknown
  industry?: unknown
  source?: unknown
  level?: unknown
  notes?: unknown
  updated?: unknown
  updated_at?: unknown
}

export function mapClientRecord(record: ClientRecord): Client {
  return {
    id: record.id,
    name: String(record.name || ''),
    contactName: String(record.contact_name || ''),
    contactPhone: String(record.contact_phone || ''),
    contactWechat: String(record.contact_wechat || ''),
    company: String(record.company || ''),
    industry: String(record.industry || 'other'),
    source: String(record.source || 'other'),
    level: (record.level || 'C') as Client['level'],
    notes: String(record.notes || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function serializeClientInput(input: ClientInput) {
  return {
    name: input.name,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    contact_wechat: input.contactWechat,
    company: input.company,
    industry: input.industry,
    source: input.source,
    level: input.level,
    notes: input.notes,
  }
}
