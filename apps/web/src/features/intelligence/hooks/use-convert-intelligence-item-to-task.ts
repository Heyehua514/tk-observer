/** 情报转团队任务：通过数据库 RPC 原子创建任务并写回情报状态。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import { overviewQueryKeys } from '@/features/overview/query-keys'
import type { IntelligenceTaskDraft } from '../intelligence-model'
import { intelligenceKeys } from './use-intelligence-items'

export type ConvertIntelligenceItemToTaskInput = IntelligenceTaskDraft & {
  id: string
}

export type ConvertedTeamTask = {
  id: string
  title: string
  assigneeName: string
  dueAt: string
  region: string
}

export function useConvertIntelligenceItemToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: ConvertIntelligenceItemToTaskInput
    ): Promise<ConvertedTeamTask> => {
      if (getDataProvider() !== 'supabase') {
        throw new Error('当前数据服务只读，暂不支持转任务')
      }

      const { data, error } = await getSupabaseClient().rpc(
        'convert_intelligence_item_to_task',
        {
          p_intelligence_item_id: input.id,
          p_assignee_name: input.assigneeName.trim(),
          p_due_at: input.dueAt || null,
          p_region: input.region,
        }
      )
      if (error) throw error
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('任务已创建但未返回任务记录')
      }

      return {
        id: String(data.id || ''),
        title: String(data.title || ''),
        assigneeName: String(data.assignee_name || ''),
        dueAt: String(data.due_at || ''),
        region: String(data.region || ''),
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: intelligenceKeys.all }),
        queryClient.invalidateQueries({
          queryKey: overviewQueryKeys.dashboard,
        }),
        queryClient.invalidateQueries({
          queryKey: overviewQueryKeys.crossWorkspaceTasks,
        }),
      ])
    },
  })
}
