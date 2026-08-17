/** 选题库指标查询与导入历史快照对比。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { ViralFeatureSummary } from '../types'
import {
  mapImportHistory,
  mapRankedViralFeature,
  mapVideoIdeaAccountAnalytics,
  mapVideoIdeaSummary,
  mapVideoIdeaTypeAnalytics,
} from './editing-mappers'
import {
  mapSupabaseImportHistory,
  mapSupabaseRankedViralFeature,
  mapSupabaseVideoIdeaAccountAnalytics,
  mapSupabaseVideoIdeaSummary,
  mapSupabaseVideoIdeaTypeAnalytics,
} from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'
import { importHistoryKeys } from './use-import-history'
import { videoIdeaKeys } from './use-video-ideas'

export function useVideoIdeaAnalytics() {
  useEditingRealtime('video_ideas', videoIdeaKeys.all)
  useEditingRealtime('import_history', importHistoryKeys.all)
  return useQuery({
    queryKey: videoIdeaKeys.analytics(),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const [summary, accounts, types, features, history] = await Promise.all(
          [
            supabase.from('video_idea_summary').select('*').maybeSingle(),
            supabase.from('video_idea_account_stats').select('*'),
            supabase
              .from('video_idea_type_stats')
              .select('*')
              .order('average_completion_rate', { ascending: false }),
            supabase
              .from('video_idea_viral_features')
              .select('*')
              .order('feature_type', { ascending: true })
              .order('feature_rank', { ascending: true }),
            supabase
              .from('import_history')
              .select('*')
              .is('deleted_at', null)
              .order('imported_at', { ascending: false })
              .range(0, 1),
          ]
        )
        for (const result of [summary, accounts, types, features, history]) {
          if (result.error) throw result.error
        }
        const viralFeatures: ViralFeatureSummary = {
          titleWords: [],
          videoTypes: [],
          tags: [],
          dateSegments: [],
        }
        for (const feature of features.data || []) {
          const item = mapSupabaseRankedViralFeature(feature)
          if (feature.feature_type === 'title_word')
            viralFeatures.titleWords.push(item)
          if (feature.feature_type === 'video_type')
            viralFeatures.videoTypes.push(item)
          if (feature.feature_type === 'tag') viralFeatures.tags.push(item)
          if (feature.feature_type === 'date_segment')
            viralFeatures.dateSegments.push(item)
        }
        return {
          metrics: summary.data
            ? mapSupabaseVideoIdeaSummary(summary.data)
            : mapSupabaseVideoIdeaSummary({
                total_videos: 0,
                monthly_new: 0,
                viral_count: 0,
                viral_rate: 0,
                average_completion_rate: 0,
                average_views: 0,
                total_follower_gain: 0,
              }),
          accountData: (accounts.data || []).map(
            mapSupabaseVideoIdeaAccountAnalytics
          ),
          typeData: (types.data || []).map(mapSupabaseVideoIdeaTypeAnalytics),
          viralFeatures,
          latestImport: history.data?.[0]
            ? mapSupabaseImportHistory(history.data[0])
            : undefined,
          previousImport: history.data?.[1]
            ? mapSupabaseImportHistory(history.data[1])
            : undefined,
        }
      }
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
