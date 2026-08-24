/**
 * 全局搜索复用：跨工作台按关键词/角色执行搜索，供顶部弹窗与 /search 结果页共用。
 */
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  mapSupabaseCompanySearch,
  mapSupabaseCreatorSearch,
  mapSupabaseProductSearch,
  mapSupabaseVideoSearch,
} from './global-search-supabase-mapper'

export type GlobalSearchKind = 'creator' | 'product' | 'video' | 'company'
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
  role: string
): Promise<SearchGroup[]> {
  if (getDataProvider() === 'supabase')
    return runSupabaseGlobalSearch(query, role)
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
  role: string
): Promise<SearchGroup[]> {
  const allowed = supabaseAccessByRole[role] ?? []
  const groups: SearchGroup[] = []
  if (allowed.includes('creator') || allowed.includes('company')) {
    const { data } = await getSupabaseClient()
      .from('creators')
      .select('*')
      .or(
        `nickname.ilike.%${query}%,tiktok_url.ilike.%${query}%,region.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(5)
    if (data?.length) {
      groups.push({
        kind: 'creator',
        title: '达人',
        total: data.length,
        items: data.map(mapSupabaseCreatorSearch),
      })
    }
  }
  if (allowed.includes('company')) {
    const { data } = await getSupabaseClient()
      .from('clients')
      .select('*')
      .or(
        `name.ilike.%${query}%,contact_name.ilike.%${query}%,company.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(5)
    if (data?.length) {
      groups.push({
        kind: 'company',
        title: '客户',
        total: data.length,
        items: data.map(mapSupabaseCompanySearch),
      })
    }
  }
  if (allowed.includes('product')) {
    const { data } = await getSupabaseClient()
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(5)
    if (data?.length) {
      groups.push({
        kind: 'product',
        title: '商品',
        total: data.length,
        items: data.map(mapSupabaseProductSearch),
      })
    }
  }
  if (allowed.includes('video')) {
    const { data } = await getSupabaseClient()
      .from('videos')
      .select('*')
      .or(
        `title.ilike.%${query}%,creator_name.ilike.%${query}%,product_name.ilike.%${query}%`
      )
      .is('deleted_at', null)
      .limit(5)
    if (data?.length) {
      groups.push({
        kind: 'video',
        title: '视频',
        total: data.length,
        items: data.map(mapSupabaseVideoSearch),
      })
    }
  }
  return groups
}

const supabaseAccessByRole: Record<string, GlobalSearchKind[]> = {
  boss: ['creator', 'company', 'product', 'video'],
  business: ['creator', 'company'],
  market: ['product'],
  editing: ['video'],
}
