import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'

export const videoAccountSyncKeys = {
  all: ['editing', 'video-account-sync'] as const,
  dashboard: () => [...videoAccountSyncKeys.all, 'dashboard'] as const,
}

export function useVideoAccountSync() {
  return useQuery({
    queryKey: videoAccountSyncKeys.dashboard(),
    queryFn: async () => {
      if (getDataProvider() !== 'supabase')
        return { accounts: [], runs: [], stats: [] }
      const supabase = getSupabaseClient()
      const [accounts, runs, stats] = await Promise.all([
        supabase
          .from('video_accounts')
          .select('id,name,status,updated_at')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('video_sync_runs')
          .select(
            'id,status,started_at,finished_at,total_rows,inserted_rows,updated_rows,error_message'
          )
          .order('started_at', { ascending: false })
          .limit(10),
        supabase
          .from('video_account_daily_stats')
          .select(
            'video_account_id,name,snapshot_date,follower_count,follower_gain'
          )
          .order('snapshot_date', { ascending: false }),
      ])
      for (const result of [accounts, runs, stats])
        if (result.error) throw result.error
      return {
        accounts: accounts.data ?? [],
        runs: runs.data ?? [],
        stats: stats.data ?? [],
      }
    },
  })
}
