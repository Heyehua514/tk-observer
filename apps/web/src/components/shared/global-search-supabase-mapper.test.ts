/** 全局搜索 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseCompanySearch,
  mapSupabaseCreatorSearch,
  mapSupabaseProductSearch,
  mapSupabaseVideoSearch,
} from './global-search-supabase-mapper'

describe('global search Supabase mapper', () => {
  it('maps four searchable record types into common search results', () => {
    expect(
      mapSupabaseCreatorSearch({
        id: 'creator-1',
        nickname: '跨境达人',
        region: 'US',
        followers: 12000,
      })
    ).toMatchObject({ kind: 'creator', label: '跨境达人' })
    expect(
      mapSupabaseCompanySearch({
        id: 'client-1',
        name: '品牌客户',
        contact_name: '李总',
      })
    ).toMatchObject({ kind: 'company', label: '品牌客户' })
    expect(
      mapSupabaseProductSearch({
        id: 'product-1',
        name: '蓝牙音箱',
        category: 'electronics',
        region: 'US',
      })
    ).toMatchObject({ kind: 'product', label: '蓝牙音箱' })
    expect(
      mapSupabaseVideoSearch({
        id: 'video-1',
        title: '开箱视频',
        creator_name: '谢洁',
        product_name: '蓝牙音箱',
      })
    ).toMatchObject({ kind: 'video', label: '开箱视频' })
  })
})
