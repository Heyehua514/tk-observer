/** 市场工作台竞品监测查询；读取剪辑/商务共用 competitor_accounts 表。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import type { MarketCompetitorAccount } from './types'

export const marketCompetitorKeys = {
  all: ['market', 'competitors'] as const,
}

export const mapMarketCompetitor = (
  record: RecordModel
): MarketCompetitorAccount => ({
  id: record.id,
  name: String(record.name || ''),
  platform: String(record.platform || ''),
  category: String(record.category || ''),
  profileUrl: String(record.profile_url || ''),
  followerCount: Number(record.follower_count || 0),
  averageViews: Number(record.avg_views || 0),
  notes: String(record.notes || ''),
  updated: String(record.updated || ''),
})

export function useMarketCompetitors(query = '') {
  return useQuery({
    queryKey: [...marketCompetitorKeys.all, query],
    queryFn: async () => {
      const records = await pb.collection('competitor_accounts').getFullList({
        sort: 'name',
        filter: query
          ? pb.filter('name ~ {:query} || category ~ {:query} || notes ~ {:query}', {
              query,
            })
          : '',
      })
      return records.map(mapMarketCompetitor)
    },
  })
}
