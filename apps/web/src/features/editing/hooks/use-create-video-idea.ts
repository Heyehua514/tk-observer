/** 爆款选题新增 mutation；is_viral 由 PocketBase hook 计算。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import type { VideoIdeaInput } from '../types'
import { mapVideoIdea, serializeVideoIdea } from './editing-mappers'
import { videoIdeaKeys } from './use-video-ideas'

export function useCreateVideoIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VideoIdeaInput) => {
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
