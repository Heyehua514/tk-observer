/** 选题库指标查询与导入历史快照对比。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import type { ViralFeatureSummary } from '../types'
import {
  mapImportHistory,
  mapRankedViralFeature,
  mapVideoIdeaAccountAnalytics,
  mapVideoIdeaSummary,
  mapVideoIdeaTypeAnalytics,
} from './editing-mappers'
import { useEditingRealtime } from './use-editing-realtime'
import { importHistoryKeys } from './use-import-history'
import { videoIdeaKeys } from './use-video-ideas'

export function useVideoIdeaAnalytics() {
  useEditingRealtime('video_ideas', videoIdeaKeys.all)
  useEditingRealtime('import_history', importHistoryKeys.all)
  return useQuery({
    queryKey: videoIdeaKeys.analytics(),
    queryFn: async () => {
      const [summary, accounts, types, features, history] = await Promise.all([
        pb.collection('video_idea_summary').getOne('videoideasum001'),
        pb.collection('video_idea_account_stats').getFullList(),
        pb.collection('video_idea_type_stats').getFullList({
          sort: '-average_completion_rate',
        }),
        pb.collection('video_idea_viral_features').getFullList({
          sort: 'feature_type,feature_rank',
        }),
        pb.collection('import_history').getList(1, 2, { sort: '-imported_at' }),
      ])
      const viralFeatures: ViralFeatureSummary = {
        titleWords: [],
        videoTypes: [],
        tags: [],
        dateSegments: [],
      }
      for (const feature of features) {
        const item = mapRankedViralFeature(feature)
        if (feature.feature_type === 'title_word')
          viralFeatures.titleWords.push(item)
        if (feature.feature_type === 'video_type')
          viralFeatures.videoTypes.push(item)
        if (feature.feature_type === 'tag') viralFeatures.tags.push(item)
        if (feature.feature_type === 'date_segment')
          viralFeatures.dateSegments.push(item)
      }
      return {
        metrics: mapVideoIdeaSummary(summary),
        accountData: accounts.map(mapVideoIdeaAccountAnalytics),
        typeData: types.map(mapVideoIdeaTypeAnalytics),
        viralFeatures,
        latestImport: history.items[0]
          ? mapImportHistory(history.items[0])
          : undefined,
        previousImport: history.items[1]
          ? mapImportHistory(history.items[1])
          : undefined,
      }
    },
  })
}
