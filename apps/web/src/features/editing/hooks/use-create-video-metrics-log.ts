/** 成片表现数据打卡 mutation：写入 video_metrics_logs 并原子触发 videos 状态与指标更新。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { VideoMetricsLogInput } from '../video-metrics-model'
import { videoArchiveKeys } from './use-video-archive'
import { videoMetricsKeys } from './use-video-metrics-logs'
import { serializeVideoMetricsLog } from './video-metrics-mapper'

export function useCreateVideoMetricsLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VideoMetricsLogInput) => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const payload = serializeVideoMetricsLog(input)
        const { error } = await supabase
          .from('video_metrics_logs')
          .insert(payload)
        if (error) throw error

        // 前端再次显式更新 videos，确保触发器之外的客户端缓存双重保险
        await supabase
          .from('videos')
          .update({
            views: payload.views,
            likes: payload.likes,
            comments: payload.comments,
            shares: payload.shares,
            completion_rate: payload.completion_rate,
            conversion_gmv_cents: payload.conversion_gmv_cents,
            order_count: payload.order_count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.videoId)

        return
      }

      // PocketBase 兼容回退
      const payload = serializeVideoMetricsLog(input)
      try {
        await pb.collection('video_metrics_logs').create(payload)
      } catch {
        // collection 未就绪时静默
      }
      try {
        await pb.collection('videos').update(input.videoId, {
          views: payload.views,
          likes: payload.likes,
          comments: payload.comments,
          shares: payload.shares,
          completion_rate: payload.completion_rate,
          conversion_gmv_cents: payload.conversion_gmv_cents,
          order_count: payload.order_count,
        })
      } catch {
        // videos 兼容
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: videoMetricsKeys.byVideo(variables.videoId),
      })
      void queryClient.invalidateQueries({ queryKey: videoArchiveKeys.all })
      toast.success('数据表现已回流并同步')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '录入数据表现失败')
    },
  })
}
