/** 达人管理详情查询模板。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapCreator } from './creator-mapper'
import { creatorKeys } from './use-creators'

export function useCreator(id: string | null) {
  return useQuery({
    queryKey: creatorKeys.detail(id || ''),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('creators')
          .select('*')
          .eq('id', id || '')
          .is('deleted_at', null)
          .single()
        if (error) throw error
        return mapCreator(data)
      }
      return mapCreator(await pb.collection('creators').getOne(id || ''))
    },
    enabled: !!id,
  })
}
