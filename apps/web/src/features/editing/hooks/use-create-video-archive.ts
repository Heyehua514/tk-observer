/** 成片归档上传 mutation：Supabase-first（Storage video-files + videos 行），PocketBase 显式回退。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  buildVideoFilePath,
  isSupportedVideoFile,
  serializeVideoArchiveInput,
} from '../components/video-archive-upload'
import type { VideoArchiveInput } from '../types'
import { videoArchiveKeys } from './use-video-archive'

export function useCreateVideoArchive() {
  const owner = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VideoArchiveInput) => {
      if (!isSupportedVideoFile(input.file)) {
        throw new Error('仅支持 MP4 / WebM / MOV，且文件不超过 512MB')
      }
      if (getDataProvider() === 'supabase') {
        const filePath = buildVideoFilePath(owner, input.file.name)
        const supabase = getSupabaseClient()
        const upload = await supabase.storage
          .from('video-files')
          .upload(filePath, input.file, { upsert: false })
        if (upload.error) throw upload.error
        const { error } = await supabase
          .from('videos')
          .insert(serializeVideoArchiveInput(input, filePath))
        if (error) throw error
        return
      }
      const form = new FormData()
      form.set('title', input.title)
      form.set('region', input.region)
      form.set('file', input.file)
      if (input.publishAt) form.set('publish_at', input.publishAt)
      if (input.productName) form.set('product_name', input.productName)
      if (input.creatorName) form.set('creator_name', input.creatorName)
      await pb.collection('videos').create(form)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoArchiveKeys.all })
      toast.success('成片已归档')
    },
  })
}
