/** 爆款选题详情查询。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { mapVideoIdea } from './editing-mappers'
import { videoIdeaKeys } from './use-video-ideas'

export function useVideoIdea(id: string) {
  return useQuery({
    queryKey: videoIdeaKeys.detail(id),
    queryFn: async () =>
      mapVideoIdea(await pb.collection('video_ideas').getOne(id)),
    enabled: Boolean(id),
  })
}
