/** 通知已读 mutation，支持单条和当前列表批量已读。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { notificationKeys } from '@/hooks/use-notifications'

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (getDataProvider() === 'supabase') {
        if (!ids.length) return
        const { error } = await getSupabaseClient()
          .from('notifications')
          .update({ is_read: true })
          .in('id', ids)
        if (error) throw error
        return
      }
      await Promise.all(
        ids.map((id) =>
          pb.collection('notifications').update(id, { is_read: true })
        )
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
