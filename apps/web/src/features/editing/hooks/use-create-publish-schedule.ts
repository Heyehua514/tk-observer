/** 剪辑工作台发布排期新增 mutation；supabase-first。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { PublishScheduleInput } from '../types'
import { serializeSupabasePublishSchedule } from './editing-supabase-mappers'
import { publishScheduleKeys } from './use-publish-schedules'

export function useCreatePublishSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PublishScheduleInput) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('publish_schedules')
          .insert(serializeSupabasePublishSchedule(input))
          .select('*')
          .single()
        if (error) throw error
        return { id: String(data.id), title: input.title }
      }
      const created = await pb.collection('publish_schedules').create(input)
      return { id: String(created.id), title: input.title }
    },
    onSuccess: ({ id, title }) => {
      recordAudit('新增发布排期', 'publish_schedules', id)
      void queryClient.invalidateQueries({ queryKey: publishScheduleKeys.all })
      toast.success(`已创建「${title}」发布排期`)
    },
  })
}
