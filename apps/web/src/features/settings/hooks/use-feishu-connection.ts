/** 飞书连接数据 Hook；权限：当前用户仅查询和绑定自己的账号。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { useAuthStore } from '@/stores/auth-store'

type FeishuConnection = {
  connected: boolean
  connectedAt: string
  syncEnabled: boolean
}

export function useFeishuConnection() {
  const userId = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  const queryKey = ['settings', 'feishu', userId] as const
  const connection = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<FeishuConnection> => {
      const record = await pb.collection('users').getOne(userId, {
        fields:
          'id,feishu_open_id,feishu_connected_at,feishu_sync_enabled',
      })
      return {
        connected: Boolean(record.feishu_open_id),
        connectedAt: String(record.feishu_connected_at || ''),
        syncEnabled: record.feishu_sync_enabled !== false,
      }
    },
  })
  const exchangeToken = useMutation({
    mutationFn: (code: string) =>
      pb.send('/api/tk-observer/feishu/exchange-token', {
        method: 'POST',
        body: { code, userId },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { connection, exchangeToken, userId }
}
