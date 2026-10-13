/** 成片表现数据回流查询与维护 Hook：支持 Supabase 实时时间线、软删除与 PocketBase 兼容回退。 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { VideoMetricsLog } from '../video-metrics-model'
import { mapVideoMetricsLog } from './video-metrics-mapper'

export const videoMetricsKeys = {
  all: ['video-metrics-logs'] as const,
  byVideo: (videoId: string) => ['video-metrics-logs', videoId] as const,
}

export function useVideoMetricsLogs(videoId: string) {
  return useQuery({
    queryKey: videoMetricsKeys.byVideo(videoId),
    queryFn: async (): Promise<VideoMetricsLog[]> => {
      if (!videoId) return []
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('video_metrics_logs')
          .select('*')
          .eq('video_id', videoId)
          .is('deleted_at', null)
          .order('logged_at', { ascending: false })

        if (error) throw error
        return (data || []).map(mapVideoMetricsLog)
      }

      // PocketBase 兼容降级
      try {
        const records = await pb.collection('video_metrics_logs').getFullList({
          filter: `video_id = "${videoId}"`,
          sort: '-logged_at',
        })
        return records.map((record) =>
          mapVideoMetricsLog({
            id: record.id,
            video_id: record.video_id,
            views: record.views,
            likes: record.likes,
            comments: record.comments,
            shares: record.shares,
            completion_rate: record.completion_rate,
            conversion_gmv_cents: record.conversion_gmv_cents,
            order_count: record.order_count,
            logged_at: record.logged_at,
            operator_name: record.operator_name,
            notes: record.notes,
            created_at: record.created,
            updated_at: record.updated,
          })
        )
      } catch {
        return []
      }
    },
    enabled: Boolean(videoId),
    placeholderData: keepPreviousData,
  })
}

/** 软删除成片表现数据打卡记录 */
export function useDeleteVideoMetricsLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, videoId }: { id: string; videoId: string }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('video_metrics_logs')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return { id, videoId }
      }
      try {
        await pb.collection('video_metrics_logs').delete(id)
      } catch {
        // 兼容降级
      }
      return { id, videoId }
    },
    onSuccess: ({ videoId }) => {
      void queryClient.invalidateQueries({
        queryKey: videoMetricsKeys.byVideo(videoId),
      })
    },
  })
}
