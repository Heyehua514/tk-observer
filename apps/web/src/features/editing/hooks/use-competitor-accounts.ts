/** 对标账号列表查询，按账号卡片展示并实时同步。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapCompetitorAccount } from './editing-mappers'
import { mapSupabaseCompetitorAccount } from './editing-supabase-mappers'
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
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        let request = supabase
          .from('competitor_accounts')
          .select('*')
          .is('deleted_at', null)
          .order('name', { ascending: true })
        if (query) {
          const escaped = query.replace(/%/g, '\\%').replace(/,/g, '\\,')
          request = request.or(
            `name.ilike.%${escaped}%,notes.ilike.%${escaped}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapSupabaseCompetitorAccount)
      }
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
    }) => {
      const payload = {
        follower_count: followerCount,
        avg_views: averageViews,
        profile_url: profileUrl || null,
        notes,
      }
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('competitor_accounts')
          .update(payload)
          .eq('id', id)
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseCompetitorAccount(data)
      }
      return mapCompetitorAccount(
        await pb.collection('competitor_accounts').update(id, {
          follower_count: followerCount,
          avg_views: averageViews,
          profile_url: profileUrl || null,
          notes,
        })
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: competitorAccountKeys.all,
      })
      toast.success('对标账号资料已更新')
    },
  })
}
