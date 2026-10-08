import type { GlobalSearchKind } from './global-search-core'

export const supabaseTableByKind = {
  creator: 'creators',
  company: 'companies',
  product: 'products',
  video: 'videos',
  knowledge: 'failed_cases',
  ai_memory: 'ai_memory',
  account: 'video_accounts',
} as const satisfies Record<GlobalSearchKind, string>

export function getSupabaseRecordDetailSelect(kind: GlobalSearchKind) {
  const selects = {
    creator: 'id,nickname,tiktok_url,region',
    company: 'id,company_name,contact_name,region',
    product: 'id,name,category,region',
    video: 'id,title,creator_name,product_name,region',
    knowledge: 'id,case_title,department,reason',
    ai_memory: 'id,memory_key,memory_value,confidence',
    account: 'id,name,platform,status',
  } as const satisfies Record<GlobalSearchKind, string>
  return selects[kind]
}
