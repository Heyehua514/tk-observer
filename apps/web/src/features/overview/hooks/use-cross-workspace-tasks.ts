/**
 * 跨工作台未结任务与风险聚合 Hook
 * 实时汇聚：设计工作台、剪辑工作台、商务工作台未完成事项
 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import type { CrossWorkspaceTask } from '../components/cross-workspace-tasks-model'

export type RawDesignTaskRow = {
  id: string
  title: string
  status: string
  due_at?: string | null
}

export type RawVideoTaskRow = {
  id: string
  title: string
  status: string
  due_at?: string | null
  owner_name?: string | null
}

export type RawOpportunityRow = {
  id: string
  title: string
  stage: string
  expected_close?: string | null
}

export function mapAndSortCrossWorkspaceTasks(
  designRows: RawDesignTaskRow[] = [],
  videoRows: RawVideoTaskRow[] = [],
  oppRows: RawOpportunityRow[] = []
): CrossWorkspaceTask[] {
  const result: CrossWorkspaceTask[] = []

  for (const r of designRows) {
    if (r.status === 'done') continue
    result.push({
      id: `design-${r.id}`,
      title: r.title,
      workspace: 'design',
      status: r.status,
      dueAt: r.due_at || undefined,
    })
  }

  for (const r of videoRows) {
    if (r.status === 'done') continue
    result.push({
      id: `editing-${r.id}`,
      title: r.title,
      workspace: 'editing',
      status: r.status,
      dueAt: r.due_at || undefined,
      assigneeName: r.owner_name || undefined,
    })
  }

  for (const r of oppRows) {
    if (r.stage === 'won' || r.stage === 'lost') continue
    result.push({
      id: `business-${r.id}`,
      title: r.title,
      workspace: 'business',
      status: r.stage,
      dueAt: r.expected_close || undefined,
    })
  }

  // 排序：有明确截止时间的排前面，按截止时间由早到晚；无截止时间的沉底
  return result.sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    }
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return 0
  })
}

export function useCrossWorkspaceTasks() {
  return useQuery<CrossWorkspaceTask[]>({
    queryKey: ['cross-workspace-tasks'],
    queryFn: async (): Promise<CrossWorkspaceTask[]> => {
      if (getDataProvider() !== 'supabase') {
        return []
      }

      try {
        const client = getSupabaseClient()
        const [designRes, videoRes, oppRes] = await Promise.all([
          client
            .from('design_tasks')
            .select('id, title, status, due_at')
            .is('deleted_at', null)
            .limit(20),
          client
            .from('video_tasks')
            .select('id, title, status, due_at, owner_name')
            .is('deleted_at', null)
            .limit(20),
          client
            .from('opportunities')
            .select('id, title, stage, expected_close')
            .is('deleted_at', null)
            .limit(20),
        ])

        return mapAndSortCrossWorkspaceTasks(
          (designRes.data || []) as RawDesignTaskRow[],
          (videoRes.data || []) as RawVideoTaskRow[],
          (oppRes.data || []) as RawOpportunityRow[]
        )
      } catch {
        return []
      }
    },
    staleTime: 60 * 1000,
  })
}
