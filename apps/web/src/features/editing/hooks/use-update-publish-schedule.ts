/** 剪辑工作台发布排期更新 mutation：状态流转与字段编辑。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { PublishScheduleInput } from '../types'
import { buildSupabasePublishScheduleUpdate } from './editing-supabase-mappers'
import { publishScheduleKeys } from './use-publish-schedules'

export function useUpdatePublishSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<PublishScheduleInput>
    }) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('publish_schedules')
          .update(buildSupabasePublishScheduleUpdate(input))
          .eq('id', id)
          .select('*')
          .single()
        if (error) throw error
        return { id: String(data.id), status: String(data.status) }
      }
      const updated = await pb
        .collection('publish_schedules')
        .update(id, input)
      return { id: String(updated.id), status: String(updated.status) }
    },
    onSuccess: ({ id, status }) => {
      recordAudit('更新发布排期', 'publish_schedules', id)
      void queryClient.invalidateQueries({ queryKey: publishScheduleKeys.all })
      toast.success(`排期已更新（${status}）`)
    },
  })
}
