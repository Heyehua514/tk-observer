/** 爆款选题新增 mutation；is_viral 由 PocketBase hook 计算。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { VideoIdeaInput } from '../types'
import { mapVideoIdea, serializeVideoIdea } from './editing-mappers'
import {
  mapSupabaseVideoIdeaRecord,
  serializeSupabaseVideoIdea,
} from './editing-supabase-mappers'
import { videoIdeaKeys } from './use-video-ideas'

export function useCreateVideoIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VideoIdeaInput) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('video_ideas')
          .insert(serializeSupabaseVideoIdea(input))
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseVideoIdeaRecord(data)
      }
      const created = await pb
        .collection('video_ideas')
        .create(serializeVideoIdea(input))
      return mapVideoIdea(await pb.collection('video_ideas').getOne(created.id))
    },
    onSuccess: (idea) => {
      recordAudit('新增视频选题', 'video_ideas', idea.id)
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      toast.success('选题已新增，爆款状态已自动计算')
    },
  })
}
