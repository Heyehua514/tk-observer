/**
 * 当前用户通知查询，通过 PocketBase realtime 同步新通知和已读状态。
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@/types/notification'
import type { RecordModel } from 'pocketbase'
import { useAuthStore } from '@/stores/auth-store'
import { pb } from '@/lib/pocketbase'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (recipient: string) =>
    [...notificationKeys.all, 'list', recipient] as const,
}

function mapNotification(record: RecordModel): AppNotification {
  return {
    id: record.id,
    recipient: String(record.recipient),
    type: record.type as AppNotification['type'],
    title: String(record.title),
    content: String(record.content),
    link: String(record.link || ''),
    isRead: Boolean(record.is_read),
    created: String(record.created),
  }
}

export function useNotifications() {
  const recipient = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!recipient) return
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('notifications')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.list(recipient),
        })
      })
      .then((stop) => {
        if (disposed) stop()
        else unsubscribe = stop
      })
    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [queryClient, recipient])

  return useQuery({
    queryKey: notificationKeys.list(recipient),
    queryFn: async () => {
      const records = await pb.collection('notifications').getList(1, 30, {
        sort: '-created',
      })
      return records.items.map(mapNotification)
    },
    enabled: !!recipient,
  })
}
