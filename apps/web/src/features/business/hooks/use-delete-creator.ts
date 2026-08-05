/** 达人管理删除 mutation 模板；调用方必须先展示二次确认弹窗。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import { creatorKeys } from './use-creators'

export function useDeleteCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
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
