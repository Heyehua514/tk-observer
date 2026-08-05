/** 设计素材上传 mutation，文件直接写入 PocketBase 文件存储。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { pb } from '@/lib/pocketbase'
import type { DesignAssetInput } from '../types'
import { designAssetKeys } from './use-design-assets'

export function useCreateDesignAsset() {
  const owner = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DesignAssetInput) => {
      const form = new FormData()
      form.set('file_name', input.fileName)
      form.set('file', input.file)
      form.set('dimensions', input.dimensions)
      form.set('region', input.region)
      form.set('status', 'draft')
      form.set('owner', owner)
      await pb.collection('design_assets').create(form)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: designAssetKeys.all })
      toast.success('素材已上传为草稿')
    },
  })
}
