import { useCallback } from 'react'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import {
  normalizeAiWorkspaceItems,
  type AiWorkspaceItem,
} from '../ai-workspace-context'

export type AiWorkspaceContextResult = {
  available: boolean
  items: AiWorkspaceItem[]
  missingSources: string[]
}

type ContextSource = {
  source: string
  kind: string
  table: string
  columns: string
  title: string
  status: string
  dueAt?: string
  metric?: string
}

type ContextRow = Record<string, unknown>
type ContextQuery = (source: string, definition: ContextSource) => Promise<ContextRow[]>

const sourcesByScope: Record<string, ContextSource[]> = {
  总览工作台: [
    { source: '团队任务', kind: '团队任务', table: 'team_tasks', columns: 'title,progress,due_at,updated_at', title: 'title', status: 'progress', dueAt: 'due_at', metric: 'progress' },
    { source: '活动', kind: '活动', table: 'events', columns: 'name,status,start_date,total_budget,updated_at', title: 'name', status: 'status', dueAt: 'start_date', metric: 'total_budget' },
  ],
  商务工作台: [
    { source: '商机', kind: '商机', table: 'opportunities', columns: 'title,stage,expected_close,amount,updated_at', title: 'title', status: 'stage', dueAt: 'expected_close', metric: 'amount' },
    { source: '渠道商单', kind: '渠道商单', table: 'channel_orders', columns: 'title,status,publish_date,amount,updated_at', title: 'title', status: 'status', dueAt: 'publish_date', metric: 'amount' },
  ],
  市场工作台: [
    { source: '活动', kind: '活动', table: 'events', columns: 'name,status,start_date,total_budget,updated_at', title: 'name', status: 'status', dueAt: 'start_date', metric: 'total_budget' },
    { source: '活动任务', kind: '活动任务', table: 'event_tasks', columns: 'title,status,due_date,priority,updated_at', title: 'title', status: 'status', dueAt: 'due_date', metric: 'priority' },
  ],
  设计工作台: [
    { source: '设计需求', kind: '设计需求', table: 'design_requirements', columns: 'title,status,due_date,priority,updated_at', title: 'title', status: 'status', dueAt: 'due_date', metric: 'priority' },
    { source: '设计任务', kind: '设计任务', table: 'design_tasks', columns: 'title,status,due_at,region,updated_at', title: 'title', status: 'status', dueAt: 'due_at', metric: 'region' },
  ],
  剪辑工作台: [
    { source: '选题', kind: '选题', table: 'video_ideas', columns: 'title,video_type,publish_date,views,is_viral,updated_at', title: 'title', status: 'video_type', dueAt: 'publish_date', metric: 'views' },
    { source: '视频任务', kind: '视频任务', table: 'video_tasks', columns: 'title,status,due_at,region,updated_at', title: 'title', status: 'status', dueAt: 'due_at', metric: 'region' },
    { source: '热点', kind: '热点', table: 'trending_topics', columns: 'topic,heat_level,discovered_at,updated_at', title: 'topic', status: 'heat_level', dueAt: 'discovered_at' },
  ],
}

function toItem(row: ContextRow, source: ContextSource): AiWorkspaceItem {
  const value = (key: string | undefined) => (key && row[key] != null ? String(row[key]) : '')
  return {
    kind: source.kind,
    title: value(source.title) || '未命名记录',
    status: value(source.status) || '未标记',
    dueAt: value(source.dueAt) || undefined,
    metric: value(source.metric) || undefined,
    updatedAt: value('updated_at') || undefined,
  }
}

export function createAiWorkspaceContextLoader(scope: string, query: ContextQuery) {
  return async (): Promise<AiWorkspaceContextResult> => {
    const sources = sourcesByScope[scope] || []
    if (!sources.length) return { available: false, items: [], missingSources: ['当前工作台'] }
    const results = await Promise.allSettled(sources.map(async (source) => ({ source, rows: await query(source.source, source) })))
    const missingSources: string[] = []
    const items: AiWorkspaceItem[] = []
    for (const result of results) {
      if (result.status === 'rejected') {
        const source = sources[results.indexOf(result)]
        missingSources.push(source.source)
      } else {
        items.push(...result.value.rows.map((row) => toItem(row, result.value.source)))
      }
    }
    return { available: true, items: normalizeAiWorkspaceItems(items), missingSources }
  }
}

function createSupabaseContextQuery(): ContextQuery {
  return async (_source, definition) => {
    const client = getSupabaseClient() as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          is: (column: string, value: null) => {
            order: (column: string, options: { ascending: boolean }) => {
              limit: (count: number) => Promise<{ data: ContextRow[] | null; error: Error | null }>
            }
          }
        }
      }
    }
    const { data, error } = await client
      .from(definition.table)
      .select(definition.columns)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(8)
    if (error) throw error
    return data || []
  }
}

export function useAiWorkspaceContext(scope: string) {
  const load = useCallback(async () => {
    if (getDataProvider() !== 'supabase') {
      return { available: false, items: [], missingSources: ['当前数据服务'] }
    }
    return createAiWorkspaceContextLoader(scope, createSupabaseContextQuery())()
  }, [scope])

  return { load }
}
