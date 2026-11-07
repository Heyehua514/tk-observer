/**
 * 跨工作台未结任务与风险聚合 Hook
 * 通过单一只读 RPC 汇聚设计、剪辑、商务与团队任务，过滤口径与 RLS 由数据库统一保证。
 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import type { CrossWorkspaceTask } from '../components/cross-workspace-tasks-model'
import { overviewQueryKeys } from '../query-keys'

export type RawOverviewActionItemRow = {
  workspace: string
  record_id: string
  title: string
  status: string
  due_at?: string | null
  assignee_name?: string | null
  source_intelligence_id?: string | null
}

const supportedWorkspaces = new Set<CrossWorkspaceTask['workspace']>([
  'design',
  'editing',
  'business',
  'team',
])

function isWorkspace(value: string): value is CrossWorkspaceTask['workspace'] {
  return supportedWorkspaces.has(value as CrossWorkspaceTask['workspace'])
}

export function mapAndSortCrossWorkspaceTasks(
  rows: RawOverviewActionItemRow[] = []
): CrossWorkspaceTask[] {
  const result = rows
    .filter((row) => isWorkspace(row.workspace))
    .map((row): CrossWorkspaceTask => ({
      id: `${row.workspace}-${row.record_id}`,
      title: row.title,
      workspace: row.workspace as CrossWorkspaceTask['workspace'],
      status: row.status,
      dueAt: row.due_at || undefined,
      assigneeName: row.assignee_name || undefined,
      sourceIntelligenceId: row.source_intelligence_id || undefined,
    }))

  // 排序：有明确截止时间的排前面，按截止时间由早到晚；无截止时间的沉底
  return result.sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      const dueDelta = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      if (dueDelta !== 0) return dueDelta
    } else if (a.dueAt) {
      return -1
    } else if (b.dueAt) {
      return 1
    }

    return (
      a.workspace.localeCompare(b.workspace) ||
      a.title.localeCompare(b.title, 'zh-CN') ||
      a.id.localeCompare(b.id)
    )
  })
}

export function useCrossWorkspaceTasks() {
  return useQuery<CrossWorkspaceTask[]>({
    queryKey: overviewQueryKeys.crossWorkspaceTasks,
    queryFn: async (): Promise<CrossWorkspaceTask[]> => {
      if (getDataProvider() !== 'supabase') {
        return []
      }

      const { data, error } = await getSupabaseClient().rpc(
        'get_overview_action_items',
        { p_limit: 50 }
      )
      if (error) throw error

      return mapAndSortCrossWorkspaceTasks(
        (data || []) as RawOverviewActionItemRow[]
      )
    },
    staleTime: 60 * 1000,
  })
}
