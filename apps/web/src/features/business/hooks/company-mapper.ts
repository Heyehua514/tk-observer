import type { RecordModel } from 'pocketbase'
import type { Company, CompanyInput } from '../types'

export function mapCompany(record: RecordModel): Company {
  return {
    id: record.id,
    companyName: String(record.company_name),
    kind: record.kind as Company['kind'],
    contactName: String(record.contact_name || ''),
    contactEmail: String(record.contact_email || ''),
    region: record.region as Company['region'],
    created: record.created,
    updated: record.updated,
  }
}

export function serializeCompany(input: CompanyInput) {
  return {
    company_name: input.companyName,
    kind: input.kind,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    region: input.region,
  }
}
