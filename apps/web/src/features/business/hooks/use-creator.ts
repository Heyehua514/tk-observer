/** 达人管理详情查询模板。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { mapCreator } from './creator-mapper'
import { creatorKeys } from './use-creators'

export function useCreator(id: string | null) {
  return useQuery({
    queryKey: creatorKeys.detail(id || ''),
    queryFn: async () =>
      mapCreator(await pb.collection('creators').getOne(id || '')),
    enabled: !!id,
  })
}
