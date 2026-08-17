/** 市场工作台竞品监测查询；读取剪辑/商务共用 competitor_accounts 表。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { MarketCompetitorAccount } from './types'

export const marketCompetitorKeys = {
  all: ['market', 'competitors'] as const,
}

type CompetitorAccountRecord = Partial<RecordModel> & Record<string, unknown>

export const mapMarketCompetitor = (
  record: CompetitorAccountRecord
): MarketCompetitorAccount => ({
  id: String(record.id || ''),
  name: String(record.name || ''),
  platform: String(record.platform || ''),
  category: String(record.category || ''),
  profileUrl: String(record.profile_url || ''),
  followerCount: Number(record.follower_count || 0),
  averageViews: Number(record.avg_views || 0),
  notes: String(record.notes || ''),
  updated: String(record.updated_at || record.updated || ''),
})

export function useMarketCompetitors(query = '') {
  return useQuery({
    queryKey: [...marketCompetitorKeys.all, query],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        let request = getSupabaseClient()
          .from('competitor_accounts')
          .select('*')
          .is('deleted_at', null)
          .order('name', { ascending: true })
        if (query) {
          const escaped = query.replace(/%/g, '\\%').replace(/,/g, '\\,')
          request = request.or(
            `name.ilike.%${escaped}%,category.ilike.%${escaped}%,notes.ilike.%${escaped}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapMarketCompetitor)
      }
      const records = await pb.collection('competitor_accounts').getFullList({
        sort: 'name',
        filter: query
          ? pb.filter(
              'name ~ {:query} || category ~ {:query} || notes ~ {:query}',
              {
                query,
              }
            )
          : '',
      })
      return records.map(mapMarketCompetitor)
    },
  })
}
