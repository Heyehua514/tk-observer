/**
 * 全局搜索复用：跨工作台按关键词/角色执行搜索，供顶部弹窗与 /search 结果页共用。
 */
import { getDataProvider } from '@/lib/data-provider'
import { searchDifyKnowledge } from '@/lib/dify-client'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  mapSupabaseCompanySearch,
  mapSupabaseCreatorSearch,
  mapSupabaseProductSearch,
  mapSupabaseVideoSearch,
  mapSupabaseKnowledgeSearch,
  mapSupabaseAiMemorySearch,
  mapSupabaseAccountSearch,
} from './global-search-supabase-mapper'

export type GlobalSearchKind =
  | 'creator'
  | 'product'
  | 'video'
  | 'company'
  | 'knowledge'
  | 'ai_memory'
  | 'account'
export type SearchResult = {
  id: string
  kind: GlobalSearchKind
  label: string
  description: string
}
export type SearchGroup = {
  kind: GlobalSearchKind
  title: string
  total: number
  items: SearchResult[]
}

export type SearchNextAction = {
  label: string
  reason: string
}

export interface GlobalSearchOptions {
  limit?: number
  kind?: GlobalSearchKind | 'all'
}

/** 根据已选搜索结果生成只读推进建议，不写入任务或业务数据。 */
export function buildSearchNextActions(
  groups: SearchGroup[]
): SearchNextAction[] {
  const actions: SearchNextAction[] = []
  if (groups.some((group) => group.kind === 'company')) {
    actions.push({
      label: '查看客户关联商机',
      reason: '搜索结果包含客户，可继续检查跟进状态。',
    })
  }
  if (groups.some((group) => group.kind === 'creator')) {
    actions.push({
      label: '补充达人合作记录',
      reason: '搜索结果包含达人，可核对合作阶段与下一次跟进。',
    })
  }
  if (groups.some((group) => group.kind === 'video')) {
    actions.push({
      label: '加入视频分析队列',
      reason: '搜索结果包含视频，可人工确认是否发起 WorkBuddy 分析。',
    })
  }
  return actions.slice(0, 3)
}

export async function runGlobalSearch(
  query: string,
  role: string,
  options?: GlobalSearchOptions
): Promise<SearchGroup[]> {
  if (getDataProvider() === 'supabase')
    return runSupabaseGlobalSearch(query, role, options)
  const tasks: Promise<SearchGroup>[] = []
  if (role === 'owner' || role === 'boss' || role === 'business') {
    tasks.push(
      pb
        .collection('creators')
        .getList(1, 5, {
          filter: pb.filter(
            'nickname ~ {:q} || tiktok_url ~ {:q} || region ~ {:q}',
            { q: query }
          ),
        })
        .then((page) => ({
          kind: 'creator' as const,
          title: '达人',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'creator' as const,
            label: String(item.nickname),
            description: `${String(item.region)} · ${Number(item.followers).toLocaleString()} 粉丝`,
          })),
        })),
      pb
        .collection('companies')
        .getList(1, 5, {
          filter: pb.filter('company_name ~ {:q} || contact_name ~ {:q}', {
            q: query,
          }),
        })
        .then((page) => ({
          kind: 'company' as const,
          title: '客户',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'company' as const,
            label: String(item.company_name),
            description: String(item.contact_name || ''),
          })),
        }))
    )
  }
  if (role === 'owner' || role === 'boss' || role === 'market') {
    tasks.push(
      pb
        .collection('products')
        .getList(1, 5, {
          filter: pb.filter('name ~ {:q} || category ~ {:q}', { q: query }),
        })
        .then((page) => ({
          kind: 'product' as const,
          title: '商品',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'product' as const,
            label: String(item.name),
            description: `${String(item.category)} · ${String(item.region)}`,
          })),
        }))
    )
  }
  if (role === 'owner' || role === 'boss' || role === 'editing') {
    tasks.push(
      pb
        .collection('videos')
        .getList(1, 5, {
          filter: pb.filter('title ~ {:q} || creator_name ~ {:q}', {
            q: query,
          }),
        })
        .then((page) => ({
          kind: 'video' as const,
          title: '视频',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'video' as const,
            label: String(item.title),
            description: String(item.creator_name || ''),
          })),
        }))
    )
  }
  return Promise.all(tasks)
}

async function runSupabaseGlobalSearch(
  query: string,
  role: string,
  options?: GlobalSearchOptions
): Promise<SearchGroup[]> {
  const allowed = supabaseAccessByRole[role] ?? []
  const limit = options?.limit ?? 5
  const targetKind =
    options?.kind && options.kind !== 'all' ? options.kind : undefined
  const groups: SearchGroup[] = []
  if (
    allowed.includes('creator') &&
    (!targetKind || targetKind === 'creator')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('creators')
      .select('*', { count: 'exact' })
      .or(
        `nickname.ilike.%${query}%,tiktok_url.ilike.%${query}%,region.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'creator',
        title: '达人',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseCreatorSearch),
      })
    }
  }
  if (
    allowed.includes('company') &&
    (!targetKind || targetKind === 'company')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('clients')
      .select('*', { count: 'exact' })
      .or(
        `name.ilike.%${query}%,contact_name.ilike.%${query}%,company.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'company',
        title: '客户',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseCompanySearch),
      })
    }
  }
  if (
    allowed.includes('product') &&
    (!targetKind || targetKind === 'product')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('products')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'product',
        title: '商品',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseProductSearch),
      })
    }
  }

  if (
    allowed.includes('knowledge') &&
    (!targetKind || targetKind === 'knowledge')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('failed_cases')
      .select('*', { count: 'exact' })
      .or(
        `case_title.ilike.%${query}%,reason.ilike.%${query}%,department.ilike.%${query}%`
      )
      .limit(limit)
    const difyRecords = await searchDifyKnowledge({ query, topK: 3 })
    const combinedKnowledge = [
      ...(data || []).map(mapSupabaseKnowledgeSearch),
      ...difyRecords.map((r) => ({
        id: r.id,
        kind: 'knowledge' as const,
        label: r.title,
        description: `[Dify知识库 ${Math.round(r.score * 100)}%] ${r.content.slice(0, 100)}...`,
      })),
    ]
    if (combinedKnowledge.length) {
      groups.push({
        kind: 'knowledge',
        title: '避坑案例与知识',
        total: (count ?? data?.length ?? 0) + difyRecords.length,
        items: combinedKnowledge.slice(0, limit),
      })
    }
  }
  if (
    allowed.includes('ai_memory') &&
    (!targetKind || targetKind === 'ai_memory')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('ai_memory')
      .select('*', { count: 'exact' })
      .or(`memory_key.ilike.%${query}%,memory_value.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'ai_memory',
        title: 'AI爆款记忆库',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseAiMemorySearch),
      })
    }
  }
  if (
    allowed.includes('account') &&
    (!targetKind || targetKind === 'account')
  ) {
    const { data, count } = await getSupabaseClient()
      .from('competitor_accounts')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,platform.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'account',
        title: '对标监控账号',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseAccountSearch),
      })
    }
  }
  if (allowed.includes('video') && (!targetKind || targetKind === 'video')) {
    const { data, count } = await getSupabaseClient()
      .from('videos')
      .select('*', { count: 'exact' })
      .or(
        `title.ilike.%${query}%,creator_name.ilike.%${query}%,product_name.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(limit)
    if (data?.length || (count !== null && count > 0)) {
      groups.push({
        kind: 'video',
        title: '视频',
        total: count ?? data?.length ?? 0,
        items: (data || []).map(mapSupabaseVideoSearch),
      })
    }
  }
  return groups
}

const supabaseAccessByRole: Record<string, GlobalSearchKind[]> = {
  owner: [
    'creator',
    'company',
    'product',
    'video',
    'knowledge',
    'ai_memory',
    'account',
  ],
  boss: [
    'creator',
    'company',
    'product',
    'video',
    'knowledge',
    'ai_memory',
    'account',
  ],
  business: ['creator', 'company', 'knowledge'],
  market: ['product', 'account', 'knowledge'],
  editing: ['video', 'ai_memory', 'account'],
  design: ['knowledge', 'ai_memory'],
}
