/** 对标账号风格分析历史查询，按账号和分析日期分组展示。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapStyleAnalysis } from './editing-mappers'
import { mapSupabaseStyleAnalysis } from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const styleAnalysisKeys = {
  all: ['competitor-style-analysis'] as const,
  list: (competitorId: string) =>
    ['competitor-style-analysis', competitorId] as const,
}

export function useStyleAnalyses(competitorId: string) {
  useEditingRealtime('competitor_style_analysis', styleAnalysisKeys.all)
  return useQuery({
    queryKey: styleAnalysisKeys.list(competitorId),
    enabled: Boolean(competitorId),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('competitor_style_analysis')
          .select('*')
          .eq('competitor_id', competitorId)
          .is('deleted_at', null)
          .order('analyzed_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSupabaseStyleAnalysis)
      }
      const result = await pb
        .collection('competitor_style_analysis')
        .getFullList({
          sort: '-analyzed_at',
          filter: pb.filter('competitor = {:competitor}', {
            competitor: competitorId,
          }),
        })
      return result.map(mapStyleAnalysis)
    },
  })
}
