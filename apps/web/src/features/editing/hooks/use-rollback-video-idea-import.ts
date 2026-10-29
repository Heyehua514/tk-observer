/** 选题导入整批撤销 mutation；数据库校验批次未被后续修改后原子删除或恢复。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import { importHistoryKeys } from './use-import-history'
import { videoIdeaKeys } from './use-video-ideas'

export type RollbackVideoIdeaImportResult = {
  importId: string
  deletedCount: number
  restoredCount: number
}

export function useRollbackVideoIdeaImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (importId: string) => {
      if (getDataProvider() !== 'supabase') {
        throw new Error('整批撤销仅支持 Supabase 数据源')
      }
      const { data, error } = await getSupabaseClient().rpc(
        'rollback_video_idea_import',
        { target_import_id: importId }
      )
      if (error) throw error
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('撤销完成但未返回处理结果')
      }
      const result = data as Record<string, unknown>
      return {
        importId: String(result.importId || importId),
        deletedCount: Number(result.deletedCount || 0),
        restoredCount: Number(result.restoredCount || 0),
      } satisfies RollbackVideoIdeaImportResult
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      void queryClient.invalidateQueries({ queryKey: importHistoryKeys.all })
      toast.success(
        `已撤销导入：删除 ${result.deletedCount} 条，恢复 ${result.restoredCount} 条`
      )
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? `撤销失败：${error.message}`
          : '撤销失败：批次可能已被修改'
      )
    },
  })
}
