/** 热点话题列表查询与 PocketBase realtime 订阅。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { mapTrendingTopic } from './editing-mappers'
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
