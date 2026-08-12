/** 对标账号爆款视频列表与分析笔记 mutation。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CompetitorVideoInput } from '../types'
import { mapCompetitorVideo } from './editing-mappers'
import { mapSupabaseCompetitorVideo } from './editing-supabase-mappers'
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
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('competitor_videos')
          .select('*')
          .eq('competitor_id', competitorId)
          .is('deleted_at', null)
          .order('views', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSupabaseCompetitorVideo)
      }
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
    competitor_id: input.competitorId,
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
    }) => {
      const payload = serializeCompetitorVideo(input)
      if (getDataProvider() === 'supabase') {
        const { competitor: _competitor, ...data } = payload
        void _competitor
        const result = await getSupabaseClient()
          .from('competitor_videos')
          .update(data)
          .eq('id', id)
          .select('*')
          .single()
        if (result.error) throw result.error
        return mapSupabaseCompetitorVideo(result.data)
      }
      return mapCompetitorVideo(
        await pb.collection('competitor_videos').update(id, payload)
      )
    },
    onSuccess: (video) => {
      void queryClient.invalidateQueries({ queryKey: competitorVideoKeys.all })
      toast.success(`已更新「${video.title}」分析笔记`)
    },
  })
}

export function useCreateCompetitorVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompetitorVideoInput) => {
      const payload = serializeCompetitorVideo(input)
      if (getDataProvider() === 'supabase') {
        const { competitor: _competitor, ...data } = payload
        void _competitor
        const result = await getSupabaseClient()
          .from('competitor_videos')
          .insert(data)
          .select('*')
          .single()
        if (result.error) throw result.error
        return mapSupabaseCompetitorVideo(result.data)
      }
      return mapCompetitorVideo(
        await pb.collection('competitor_videos').create(payload)
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: competitorVideoKeys.all })
      toast.success('对标视频已新增')
    },
  })
}
