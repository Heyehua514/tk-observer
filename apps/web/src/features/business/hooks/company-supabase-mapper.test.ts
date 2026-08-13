/** 商务公司 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseCompany,
  serializeSupabaseCompany,
} from './company-supabase-mapper'

describe('company Supabase mapper', () => {
  it('maps company rows and serializes form input', () => {
    expect(
      mapSupabaseCompany({
        id: 'company-1',
        company_name: '出海供应商',
        kind: 'supplier',
        contact_name: '王总',
        contact_email: 'wang@example.test',
        region: 'US',
        created_at: '2026-08-13T08:00:00Z',
        updated_at: '2026-08-13T09:00:00Z',
      })
    ).toEqual({
      id: 'company-1',
      companyName: '出海供应商',
      kind: 'supplier',
      contactName: '王总',
      contactEmail: 'wang@example.test',
      region: 'US',
      created: '2026-08-13T08:00:00Z',
      updated: '2026-08-13T09:00:00Z',
    })
    expect(
      serializeSupabaseCompany({
        companyName: '品牌客户',
        kind: 'client',
        contactName: '李总',
        contactEmail: '',
        region: 'UK',
      })
    ).toEqual({
      company_name: '品牌客户',
      kind: 'client',
      contact_name: '李总',
      contact_email: null,
      region: 'UK',
    })
  })
})
