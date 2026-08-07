/** 对标账号列表查询，按账号卡片展示并实时同步。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import { mapCompetitorAccount } from './editing-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const competitorAccountKeys = {
  all: ['competitor-accounts'] as const,
  list: ['competitor-accounts', 'list'] as const,
  detail: (id: string) => ['competitor-accounts', 'detail', id] as const,
}

export function useCompetitorAccounts(query = '') {
  useEditingRealtime('competitor_accounts', competitorAccountKeys.all)
  return useQuery({
    queryKey: [...competitorAccountKeys.list, query],
    queryFn: async () => {
      const result = await pb.collection('competitor_accounts').getFullList({
        sort: 'name',
        filter: query
          ? pb.filter('name ~ {:query} || notes ~ {:query}', { query })
          : '',
      })
      return result.map(mapCompetitorAccount)
    },
  })
}

export function useUpdateCompetitorAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      followerCount,
      averageViews,
      profileUrl,
      notes,
    }: {
      id: string
      followerCount: number
      averageViews: number
      profileUrl: string
      notes: string
    }) =>
      mapCompetitorAccount(
        await pb.collection('competitor_accounts').update(id, {
          follower_count: followerCount,
          avg_views: averageViews,
          profile_url: profileUrl || null,
          notes,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: competitorAccountKeys.all,
      })
      toast.success('对标账号资料已更新')
    },
  })
}
