/** 达人管理批量状态更新 mutation。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import type { CooperationStatus } from '../types'
import { creatorKeys } from './use-creators'

export function useBulkUpdateCreators() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[]
      status: CooperationStatus
    }) => {
      await Promise.all(
        ids.map((id) =>
          pb.collection('creators').update(id, { cooperation_status: status })
        )
      )
    },
    onSuccess: (_, variables) => {
      variables.ids.forEach((id) =>
        recordAudit('批量修改达人合作状态', 'creators', id)
      )
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success('批量状态已更新')
    },
  })
}
