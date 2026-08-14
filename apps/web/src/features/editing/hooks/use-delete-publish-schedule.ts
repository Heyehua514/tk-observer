/** 剪辑工作台发布排期软删除 mutation；调用方必须先显示二次确认。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { publishScheduleKeys } from './use-publish-schedules'

export function useDeletePublishSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('publish_schedules')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return id
      }
      await pb.collection('publish_schedules').update(id, {
        deleted_at: new Date().toISOString(),
      })
      return id
    },
    onSuccess: (id) => {
      recordAudit('删除发布排期', 'publish_schedules', id)
      void queryClient.invalidateQueries({ queryKey: publishScheduleKeys.all })
      toast.success('发布排期已删除')
    },
  })
}
