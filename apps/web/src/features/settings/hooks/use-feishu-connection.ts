/** 飞书连接数据 Hook；权限：当前用户仅查询和绑定自己的账号。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'

type SupabaseFeishuConnection = {
  connected: boolean
  connected_at: string | null
  sync_enabled: boolean | null
}

type FeishuConnection = {
  connected: boolean
  connectedAt: string
  syncEnabled: boolean
}

export function mapSupabaseFeishuConnection(
  row: SupabaseFeishuConnection | null
): FeishuConnection {
  return {
    connected: row?.connected === true,
    connectedAt: row?.connected_at || '',
    syncEnabled: row?.sync_enabled !== false,
  }
}

async function readPocketBaseConnection(
  userId: string
): Promise<FeishuConnection> {
  const record = await pb.collection('users').getOne(userId, {
    fields: 'id,feishu_open_id,feishu_connected_at,feishu_sync_enabled',
  })
  return {
    connected: Boolean(record.feishu_open_id),
    connectedAt: String(record.feishu_connected_at || ''),
    syncEnabled: record.feishu_sync_enabled !== false,
  }
}

export function useFeishuConnection() {
  const userId = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  const queryKey = ['settings', 'feishu', userId] as const
  const connection = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<FeishuConnection> => {
      if (getDataProvider() === 'supabase') {
        try {
          const { data, error } = await getSupabaseClient().rpc(
            'get_my_feishu_connection'
          )
          if (error) throw error
          return mapSupabaseFeishuConnection(data?.[0] || null)
        } catch {
          return readPocketBaseConnection(userId)
        }
      }
      return readPocketBaseConnection(userId)
    },
  })
  const exchangeToken = useMutation({
    mutationFn: async (code: string) => {
      if (getDataProvider() === 'supabase') {
        try {
          const { error } = await getSupabaseClient().functions.invoke(
            'feishu-oauth',
            { body: { code } }
          )
          if (!error) return
        } catch {
          // Edge Function 未部署时显式回退到 PocketBase OAuth。
        }
      }
      return pb.send('/api/tk-observer/feishu/exchange-token', {
        method: 'POST',
        body: { code, userId },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { connection, exchangeToken, userId }
}
