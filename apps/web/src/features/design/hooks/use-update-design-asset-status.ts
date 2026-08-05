/** 设计稿提审、通过和驳回 mutation。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { pb } from '@/lib/pocketbase'
import type { DesignAssetStatus } from '../types'
import { designAssetKeys } from './use-design-assets'

type UpdateDesignAssetStatusInput = {
  id: string
  status: Extract<DesignAssetStatus, 'pending_review' | 'approved' | 'rejected'>
  reason?: string
}

export function useUpdateDesignAssetStatus() {
  const reviewer = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateDesignAssetStatusInput) => {
      const reviewFields =
        input.status === 'pending_review'
          ? { review_reason: '', reviewed_by: '', reviewed_at: '' }
          : {
              review_reason: input.reason || '',
              reviewed_by: reviewer,
              reviewed_at: new Date().toISOString(),
            }
      await pb.collection('design_assets').update(input.id, {
        status: input.status,
        ...reviewFields,
      })
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: designAssetKeys.all })
      const messages = {
        pending_review: '设计稿已提交审核',
        approved: '设计稿已通过',
        rejected: '设计稿已驳回并通知设计师',
      }
      toast.success(messages[input.status])
    },
  })
}
