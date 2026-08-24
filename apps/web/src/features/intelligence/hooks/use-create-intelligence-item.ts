import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { intelligenceKeys } from './use-intelligence-items'
import type { IntelligenceDraft } from '../intelligence-model'

export function useCreateIntelligenceItem() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  return useMutation({
    mutationFn: async (draft: IntelligenceDraft) => {
      if (!user?.id) throw new Error('未登录')
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('intelligence_items')
          .insert({
            title: draft.title.trim(), summary: draft.summary.trim(),
            source_name: draft.sourceName.trim(), source_type: draft.sourceType,
            source_url: draft.sourceUrl.trim(), captured_at: draft.capturedAt,
            region: draft.region.trim(), language: draft.language.trim() || 'zh-CN',
            topic: draft.topic.trim(), heat_score: draft.heatScore,
            confidence: draft.confidence, dedupe_key: draft.dedupeKey.trim(),
            workspaces: draft.workspaces, created_by: user.id,
          })
          .select('*').single()
        if (error) throw error
        return data
      }
      throw new Error('当前数据服务只读，暂不支持写入情报')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intelligenceKeys.all }),
  })
}
