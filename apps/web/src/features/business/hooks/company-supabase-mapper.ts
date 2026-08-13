/** 商务公司 Supabase 映射层；权限：business/boss。 */
import type { Company, CompanyInput } from '../types'

type Row = Record<string, unknown>

export function mapSupabaseCompany(record: Row): Company {
  return {
    id: String(record.id || ''),
    companyName: String(record.company_name || ''),
    kind: record.kind as Company['kind'],
    contactName: String(record.contact_name || ''),
    contactEmail: String(record.contact_email || ''),
    region: record.region as Company['region'],
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function serializeSupabaseCompany(input: CompanyInput) {
  return {
    company_name: input.companyName,
    kind: input.kind,
    contact_name: input.contactName || null,
    contact_email: input.contactEmail || null,
    region: input.region,
  }
}
