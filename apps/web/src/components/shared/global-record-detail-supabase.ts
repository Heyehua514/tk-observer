/** 全局搜索详情 Supabase 查询工具；权限：按 RLS 返回当前可见记录。 */
import type { GlobalSearchKind } from './global-search-core'

export const supabaseTableByKind = {
  creator: 'creators',
  company: 'companies',
  product: 'products',
  video: 'videos',
} as const satisfies Record<GlobalSearchKind, string>

export function getSupabaseRecordDetailSelect(kind: GlobalSearchKind) {
  const selects = {
    creator: 'id,nickname,tiktok_url,region',
    company: 'id,company_name,contact_name,region',
    product: 'id,name,category,region',
    video: 'id,title,creator_name,product_name,region',
  } as const satisfies Record<GlobalSearchKind, string>
  return selects[kind]
}
