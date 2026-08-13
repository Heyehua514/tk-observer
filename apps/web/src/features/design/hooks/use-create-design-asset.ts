/** 设计素材上传 mutation，Supabase-first，PocketBase 保留回退。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { DesignAssetInput } from '../types'
import { serializeSupabaseDesignAssetUpload } from './design-supabase-mapper'
import { designAssetKeys } from './use-design-assets'

export function useCreateDesignAsset() {
  const owner = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DesignAssetInput) => {
      if (getDataProvider() === 'supabase') {
        const safeName = input.file.name.replace(/[^\w.-]+/g, '-')
        const filePath = `${owner || 'anonymous'}/${Date.now()}-${safeName}`
        const supabase = getSupabaseClient()
        const upload = await supabase.storage
          .from('design-assets')
          .upload(filePath, input.file, { upsert: false })
        if (upload.error) throw upload.error
        const { error } = await supabase
          .from('design_assets')
          .insert(serializeSupabaseDesignAssetUpload(input, owner, filePath))
        if (error) throw error
        return
      }
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
