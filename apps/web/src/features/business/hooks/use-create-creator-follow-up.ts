/** 达人跟进触达新增 mutation；联动更新达人合作状态与最近联系时间。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CreatorFollowUpInput } from '../types'
import {
  mapCreatorFollowUp,
  serializeCreatorFollowUp,
} from './creator-follow-up-mapper'
import { creatorFollowUpKeys } from './use-creator-follow-ups'
import { creatorKeys } from './use-creators'

export function useCreateCreatorFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatorFollowUpInput) => {
      const isSupabase = getDataProvider() === 'supabase'
      const payload = serializeCreatorFollowUp(input)

      if (isSupabase) {
        const supabase = getSupabaseClient()
        const { data: row, error } = await supabase
          .from('creator_follow_ups')
          .insert(payload)
          .select()
          .single()
        if (error) throw error

        // 显式更新达人表的合作状态和最近联系时间，确保即时回流
        await supabase
          .from('creators')
          .update({
            cooperation_status: input.status,
            last_contacted_at: payload.contacted_at,
          })
          .eq('id', input.creatorId)

        return mapCreatorFollowUp(row)
      }

      // PocketBase 回退逻辑
      const pbPayload = {
        creator: input.creatorId,
        channel: input.channel,
        status: input.status,
        summary: input.summary,
        contacted_at: payload.contacted_at,
        next_follow_up_at: payload.next_follow_up_at,
        operator_name: payload.operator_name,
      }
      const record = await pb.collection('creator_follow_ups').create(pbPayload)
      try {
        await pb.collection('creators').update(input.creatorId, {
          cooperation_status: input.status,
          last_contacted_at: payload.contacted_at,
        })
      } catch {
        // 容错处理
      }
      return mapCreatorFollowUp(record)
    },
    onSuccess: (followUp) => {
      recordAudit('新增达人触达跟进', 'creator_follow_ups', followUp.id)
      void queryClient.invalidateQueries({
        queryKey: creatorFollowUpKeys.list(followUp.creatorId),
      })
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success('已登记触达跟进并同步合作状态')
    },
    onError: (error) => {
      toast.error(`登记失败: ${error instanceof Error ? error.message : '未知错误'}`)
    },
  })
}
