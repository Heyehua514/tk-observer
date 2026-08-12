/** 爆款选题详情查询。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapVideoIdea } from './editing-mappers'
import { mapSupabaseVideoIdeaRecord } from './editing-supabase-mappers'
import { videoIdeaKeys } from './use-video-ideas'

export function useVideoIdea(id: string) {
  return useQuery({
    queryKey: videoIdeaKeys.detail(id),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('video_ideas')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        return mapSupabaseVideoIdeaRecord(data)
      }
      return mapVideoIdea(await pb.collection('video_ideas').getOne(id))
    },
    enabled: Boolean(id),
  })
}
