/** 达人管理新增 mutation 模板。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CreatorInput } from '../types'
import {
  mapCreator,
  serializeCreator,
  serializeSupabaseCreator,
} from './creator-mapper'
import { creatorKeys } from './use-creators'

export function useCreateCreator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatorInput) => {
      const data = serializeCreator(input)
      if (getDataProvider() === 'supabase') {
        const { data: row, error } = await getSupabaseClient()
          .from('creators')
          .insert(serializeSupabaseCreator(input))
          .select()
          .single()
        if (error) throw error
        return mapCreator(row)
      }
      return mapCreator(await pb.collection('creators').create(data))
    },
    onSuccess: (creator) => {
      recordAudit('新增达人资料', 'creators', creator.id)
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all })
      toast.success('达人已新增')
    },
  })
}
