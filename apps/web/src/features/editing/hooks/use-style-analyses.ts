/** 对标账号风格分析历史查询，按账号和分析日期分组展示。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { mapStyleAnalysis } from './editing-mappers'
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
