/** 全局搜索 Supabase 映射层；权限：按当前角色可见范围查询。 */
import type { SearchResult } from './global-search'

type Row = Record<string, unknown>

export function mapSupabaseCreatorSearch(record: Row): SearchResult {
  return {
    id: String(record.id || ''),
    kind: 'creator',
    label: String(record.nickname || ''),
    description: `${String(record.region || '')} · ${Number(record.followers || 0).toLocaleString()} 粉丝`,
  }
}

export function mapSupabaseCompanySearch(record: Row): SearchResult {
  return {
    id: String(record.id || ''),
    kind: 'company',
    label: String(record.company_name || ''),
    description: String(record.contact_name || '暂无联系人'),
  }
}

export function mapSupabaseProductSearch(record: Row): SearchResult {
  return {
    id: String(record.id || ''),
    kind: 'product',
    label: String(record.name || ''),
    description: `${String(record.category || '')} · ${String(record.region || '')}`,
  }
}

export function mapSupabaseVideoSearch(record: Row): SearchResult {
  return {
    id: String(record.id || ''),
    kind: 'video',
    label: String(record.title || ''),
    description: `${String(record.creator_name || '未关联达人')} · ${String(record.product_name || '未关联商品')}`,
  }
}
