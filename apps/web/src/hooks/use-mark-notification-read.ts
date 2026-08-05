/** 通知已读 mutation，支持单条和当前列表批量已读。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { notificationKeys } from '@/hooks/use-notifications'

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
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
