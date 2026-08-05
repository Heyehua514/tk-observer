/** 达人管理新增 mutation 模板。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import type { CreatorInput } from '../types'
import { mapCreator, serializeCreator } from './creator-mapper'
import { creatorKeys } from './use-creators'

export function useCreateCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatorInput) =>
      mapCreator(
        await pb.collection('creators').create(serializeCreator(input))
      ),
    onSuccess: (creator) => {
      recordAudit('新增达人资料', 'creators', creator.id)
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success('达人已新增')
    },
  })
}
