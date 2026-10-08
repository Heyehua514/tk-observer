/** 全局搜索 Supabase 映射层；权限：按当前角色可见范围查询。 */
import type { SearchResult } from './global-search-core'

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
    label: String(record.company_name || record.name || ''),
    description: String(record.contact_name || record.contact_phone || '暂无联系人'),
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


export function mapSupabaseKnowledgeSearch(record: Row): SearchResult {
  return {
    id: String(record.id || ""),
    kind: "knowledge",
    label: String(record.case_title || "案例避坑经验"),
    description: "[" + String(record.department || "通用") + "] " + String(record.reason || "无避坑描述"),
  }
}

export function mapSupabaseAiMemorySearch(record: Row): SearchResult {
  return {
    id: String(record.id || ""),
    kind: "ai_memory",
    label: String(record.memory_key || "AI爆款经验模型"),
    description: String(record.memory_value || ""),
  }
}

export function mapSupabaseAccountSearch(record: Row): SearchResult {
  return {
    id: String(record.id || ""),
    kind: "account",
    label: String(record.name || "对标账号"),
    description: "平台: " + String(record.platform || "未知") + " · 状态: " + String(record.status || "active"),
  }
}
