/** 通知 Supabase 映射层；权限：当前用户只读自己的通知。 */
import type { AppNotification } from '@/types/notification'

type NotificationRowLike = {
  id?: unknown
  recipient_id?: unknown
  type?: unknown
  title?: unknown
  content?: unknown
  link?: unknown
  is_read?: unknown
  created_at?: unknown
}

export function mapSupabaseNotification(
  record: NotificationRowLike
): AppNotification {
  return {
    id: String(record.id || ''),
    recipient: String(record.recipient_id || ''),
    type: record.type as AppNotification['type'],
    title: String(record.title || ''),
    content: String(record.content || ''),
    link: String(record.link || ''),
    isRead: Boolean(record.is_read),
    created: String(record.created_at || ''),
  }
}
