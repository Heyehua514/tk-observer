/** 对标账号风格分析历史记录新增 mutation。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CompetitorStyleAnalysisInput } from '../types'
import { mapStyleAnalysis } from './editing-mappers'
import { mapSupabaseStyleAnalysis } from './editing-supabase-mappers'
import { styleAnalysisKeys } from './use-style-analyses'

export function useCreateStyleAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompetitorStyleAnalysisInput) => {
      const supabasePayload = {
        competitor_id: input.competitorId,
        content_style: input.contentStyle,
        title_pattern: input.titlePattern,
        hook_method: input.hookMethod,
        editing_style: input.editingStyle,
        viral_factors: input.viralFactors,
        applicable_to_us: input.applicableToUs,
        analyzed_at: `${input.analyzedAt} 00:00:00.000Z`,
      }
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('competitor_style_analysis')
          .insert(supabasePayload)
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseStyleAnalysis(data)
      }
      return mapStyleAnalysis(
        await pb.collection('competitor_style_analysis').create({
          competitor: input.competitorId,
          content_style: input.contentStyle,
          title_pattern: input.titlePattern,
          hook_method: input.hookMethod,
          editing_style: input.editingStyle,
          viral_factors: input.viralFactors,
          applicable_to_us: input.applicableToUs,
          analyzed_at: `${input.analyzedAt} 00:00:00.000Z`,
        })
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: styleAnalysisKeys.all })
      toast.success('风格分析已保存为新版本')
    },
  })
}
