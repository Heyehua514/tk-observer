/** 对标账号爆款视频列表与分析笔记 mutation。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import type { CompetitorVideoInput } from '../types'
import { mapCompetitorVideo } from './editing-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const competitorVideoKeys = {
  all: ['competitor-videos'] as const,
  list: (competitorId: string) => ['competitor-videos', competitorId] as const,
}

export function useCompetitorVideos(competitorId: string) {
  useEditingRealtime('competitor_videos', competitorVideoKeys.all)
  return useQuery({
    queryKey: competitorVideoKeys.list(competitorId),
    enabled: Boolean(competitorId),
    queryFn: async () => {
      const result = await pb.collection('competitor_videos').getFullList({
        sort: '-views',
        filter: pb.filter('competitor = {:competitor}', {
          competitor: competitorId,
        }),
      })
      return result.map(mapCompetitorVideo)
    },
  })
}

function serializeCompetitorVideo(input: CompetitorVideoInput) {
  return {
    competitor: input.competitorId,
    title: input.title,
    url: input.url || null,
    publish_date: input.publishDate
      ? `${input.publishDate} 00:00:00.000Z`
      : null,
    views: input.views,
    likes: input.likes,
    content_tags: input.contentTags,
    why_viral: input.whyViral,
    reference_to: input.referenceTo,
  }
}

export function useUpdateCompetitorVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: CompetitorVideoInput
    }) =>
      mapCompetitorVideo(
        await pb
          .collection('competitor_videos')
          .update(id, serializeCompetitorVideo(input))
      ),
    onSuccess: (video) => {
      void queryClient.invalidateQueries({ queryKey: competitorVideoKeys.all })
      toast.success(`已更新「${video.title}」分析笔记`)
    },
  })
}

export function useCreateCompetitorVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompetitorVideoInput) =>
      mapCompetitorVideo(
        await pb
          .collection('competitor_videos')
          .create(serializeCompetitorVideo(input))
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: competitorVideoKeys.all })
      toast.success('对标视频已新增')
    },
  })
}
