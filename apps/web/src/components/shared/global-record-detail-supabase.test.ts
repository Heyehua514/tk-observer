/** 全局搜索详情 Supabase 工具测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { getSupabaseRecordDetailSelect } from './global-record-detail-supabase'

describe('getSupabaseRecordDetailSelect', () => {
  it('uses narrow selects for each global search detail type', () => {
    expect(getSupabaseRecordDetailSelect('creator')).toBe(
      'id,nickname,tiktok_url,region'
    )
    expect(getSupabaseRecordDetailSelect('company')).toBe(
      'id,company_name,contact_name,region'
    )
    expect(getSupabaseRecordDetailSelect('product')).toBe('id,name,category,region')
    expect(getSupabaseRecordDetailSelect('video')).toBe(
      'id,title,creator_name,product_name,region'
    )
  })
})
