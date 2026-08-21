/**
 * 剪辑工作台视频 AI 分析数据 Hook。
 * 流程：前端读取待分析视频 → 生成提示词 → 调用远程 WorkBuddy 分析端点 → 结果写回。
 * 说明：浏览器不能直接执行本机 CLI，因此通过超管-服务端端点代理调用 codebuddy。
 * 当前实现聚焦“取数 + 写回”，运行 WorkBuddy 的端点由本地脚本/网关提供。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { callWorkBuddyGateway } from '@/features/shared-ai/workbuddy-gateway'
import {
  buildVideoAnalysisPrompt,
  parseVideoAnalysisJson,
} from './workbuddy-runner'

export function useVideoAiAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      videos: Array<{
        id: string
        title: string
        videoType: string
        publishDate: string
        views: number
      }>
    ) => {
      const prompt = buildVideoAnalysisPrompt(videos)
      const raw = await callWorkBuddyGateway(prompt)
      const summary = parseVideoAnalysisJson(raw)
      // 将结论写回远程库（security definer RPC）
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const call = supabase.rpc(
          'write_video_idea_analysis' as never
        ) as unknown as (args: {
          target_id: string | null
          analysis: string
          analyzed: string
        }) => Promise<{ error: { message: string } | null }>
        const { error } = await call({
          target_id: null,
          analysis: JSON.stringify(summary),
          analyzed: new Date().toISOString(),
        })
        if (error) throw error
      } else {
        for (const video of videos) {
          await pb.collection('video_ideas').update(video.id, {
            ai_analysis: JSON.stringify(summary),
            analyzed_at: new Date().toISOString(),
          })
        }
      }
      return summary
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['editing', 'videoIdeas'],
      })
      toast.success('视频 AI 分析完成')
    },
    onError: () => toast.error('AI 分析失败，请检查 WorkBuddy 是否可用'),
  })
}
