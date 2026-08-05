/** 达人管理编辑 mutation 模板；表单预填后只提交合法完整值。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import type { CreatorInput } from '../types'
import { mapCreator, serializeCreator } from './creator-mapper'
import { creatorKeys } from './use-creators'

export function useUpdateCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CreatorInput }) =>
      mapCreator(
        await pb.collection('creators').update(id, serializeCreator(input))
      ),
    onSuccess: (creator) => {
      recordAudit('修改达人资料', 'creators', creator.id)
      queryClient.setQueryData(creatorKeys.detail(creator.id), creator)
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success('达人资料已更新')
    },
  })
}
