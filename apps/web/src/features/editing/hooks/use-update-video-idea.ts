/** 爆款选题编辑 mutation；保存后由服务端重算同账号爆款状态。 */
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

export function useUpdateVideoIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: VideoIdeaInput
    }) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('video_ideas')
          .update(serializeSupabaseVideoIdea(input))
          .eq('id', id)
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseVideoIdeaRecord(data)
      }
      await pb.collection('video_ideas').update(id, serializeVideoIdea(input))
      return mapVideoIdea(await pb.collection('video_ideas').getOne(id))
    },
    onSuccess: (idea) => {
      recordAudit('编辑视频选题', 'video_ideas', idea.id)
      queryClient.setQueryData(videoIdeaKeys.detail(idea.id), idea)
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      toast.success('选题已更新，爆款状态已重新计算')
    },
  })
}
