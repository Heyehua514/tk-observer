/** 热点话题列表查询与实时订阅。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapTrendingTopic } from './editing-mappers'
import { mapSupabaseTrendingTopic } from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const trendingTopicKeys = {
  all: ['trending-topics'] as const,
  list: (query: string) => ['trending-topics', 'list', query] as const,
}

export function useTrendingTopics(query = '') {
  useEditingRealtime('trending_topics', trendingTopicKeys.all)
  return useQuery({
    queryKey: trendingTopicKeys.list(query),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        let request = supabase
          .from('trending_topics')
          .select('*')
          .is('deleted_at', null)
          .order('discovered_at', { ascending: false })
        if (query) {
          const escaped = query.replace(/%/g, '\\%').replace(/,/g, '\\,')
          request = request.or(
            `topic.ilike.%${escaped}%,keywords.ilike.%${escaped}%,insight.ilike.%${escaped}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapSupabaseTrendingTopic)
      }
      const result = await pb.collection('trending_topics').getFullList({
        sort: '-discovered_at',
        filter: query
          ? pb.filter(
              'topic ~ {:query} || keywords ~ {:query} || insight ~ {:query}',
              { query }
            )
          : '',
      })
      return result.map(mapTrendingTopic)
    },
  })
}
