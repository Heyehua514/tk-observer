/** 爆款选题删除 mutation；调用方必须先显示二次确认。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import { videoIdeaKeys } from './use-video-ideas'

export function useDeleteVideoIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => pb.collection('video_ideas').delete(id))
      )
      return ids
    },
    onSuccess: (ids) => {
      ids.forEach((id) => recordAudit('删除视频选题', 'video_ideas', id))
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      toast.success(
        ids.length > 1 ? `已删除 ${ids.length} 条选题` : '选题已删除'
      )
    },
  })
}
