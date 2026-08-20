/** 通知偏好读写；权限：当前登录用户；Supabase-first，PocketBase 回退使用本地默认值。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from '../notification-preferences-model'

const key = (userId: string) => ['settings', 'notification-preferences', userId]

function mapRow(row: Record<string, unknown>): NotificationPreferences {
  return {
    deadlineEnabled: row.deadline_enabled !== false,
    reviewEnabled: row.review_enabled !== false,
    followUpEnabled: row.follow_up_enabled !== false,
  }
}

export function useNotificationPreferences() {
  const userId = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: key(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (getDataProvider() !== 'supabase')
        return defaultNotificationPreferences
      const { data, error } = await getSupabaseClient()
        .from('notification_preferences')
        .select('deadline_enabled,review_enabled,follow_up_enabled')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data ? mapRow(data) : defaultNotificationPreferences
    },
  })
  const mutation = useMutation({
    mutationFn: async (values: NotificationPreferences) => {
      if (getDataProvider() !== 'supabase') return values
      const { error } = await getSupabaseClient()
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          deadline_enabled: values.deadlineEnabled,
          review_enabled: values.reviewEnabled,
          follow_up_enabled: values.followUpEnabled,
        })
      if (error) throw error
      return values
    },
    onSuccess: (values) => {
      queryClient.setQueryData(key(userId), values)
    },
  })
  return {
    data: query.data,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  }
}
