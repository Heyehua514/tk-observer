/** 达人管理删除 mutation 模板；调用方必须先展示二次确认弹窗。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { creatorKeys } from './use-creators'

export function useDeleteCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (getDataProvider() === 'supabase') {
        await Promise.all(
          ids.map(async (id) => {
            const { error } = await getSupabaseClient()
              .from('creators')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', id)
            if (error) throw error
          })
        )
        return ids
      }
      await Promise.all(ids.map((id) => pb.collection('creators').delete(id)))
      return ids
    },
    onSuccess: (ids) => {
      ids.forEach((id) => recordAudit('删除达人资料', 'creators', id))
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success(
        ids.length > 1 ? `已删除 ${ids.length} 位达人` : '达人已删除'
      )
    },
  })
}
