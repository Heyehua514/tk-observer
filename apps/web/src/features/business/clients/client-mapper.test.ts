/** 商务客户 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapClientRecord, serializeClientInput } from './client-mapper'

describe('client mapper', () => {
  it('maps Supabase client rows into the existing frontend shape', () => {
    expect(
      mapClientRecord({
        id: 'c1',
        name: '远海品牌',
        contact_name: '张经理',
        contact_phone: '13800000000',
        contact_wechat: 'zhang',
        company: null,
        industry: 'brand',
        source: 'event',
        level: 'A',
        notes: null,
        updated_at: '2026-08-12T08:00:00Z',
      })
    ).toEqual({
      id: 'c1',
      name: '远海品牌',
      contactName: '张经理',
      contactPhone: '13800000000',
      contactWechat: 'zhang',
      company: '',
      industry: 'brand',
      source: 'event',
      level: 'A',
      notes: '',
      updated: '2026-08-12T08:00:00Z',
    })
  })

  it('serializes existing frontend input into database columns', () => {
    expect(
      serializeClientInput({
        name: '飞轮ERP',
        contactName: '王总',
        contactPhone: '',
        contactWechat: '',
        company: '飞轮软件',
        industry: 'erp',
        source: 'outbound',
        level: 'S',
        notes: '重点跟进',
      })
    ).toMatchObject({
      name: '飞轮ERP',
      contact_name: '王总',
      company: '飞轮软件',
      industry: 'erp',
      level: 'S',
    })
  })
})
