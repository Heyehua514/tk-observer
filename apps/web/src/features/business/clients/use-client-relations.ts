/** 商务工作台客户详情关联查询；读取商机和渠道商单。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  buildClientRelations,
  type ClientOpportunityRelation,
  type ClientOrderRelation,
} from './client-relations'

type RelationRecord = Partial<RecordModel> & Record<string, unknown>

export const mapClientOpportunityRelation = (
  record: RelationRecord
): ClientOpportunityRelation => ({
  id: String(record.id || ''),
  client: String(record.client_id || record.client || ''),
  title: String(record.title || ''),
  amount: Number(record.amount || 0),
  stage: String(record.stage || ''),
  probability: Number(record.probability || 0),
})

export const mapClientOrderRelation = (
  record: RelationRecord
): ClientOrderRelation => ({
  id: String(record.id || ''),
  client: String(record.client_id || record.client || ''),
  title: String(record.title || ''),
  amount: Number(record.amount || 0),
  status: String(record.status || ''),
  publishDate: String(record.publish_date || ''),
})

export function useClientRelations(clientId?: string) {
  return useQuery({
    queryKey: ['business', 'client-relations', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const [opportunities, orders] = await Promise.all([
          getSupabaseClient()
            .from('opportunities')
            .select('id,client_id,title,amount,stage,probability')
            .eq('client_id', clientId || '')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false }),
          getSupabaseClient()
            .from('channel_orders')
            .select('id,client_id,title,amount,status,publish_date')
            .eq('client_id', clientId || '')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false }),
        ])
        if (opportunities.error) throw opportunities.error
        if (orders.error) throw orders.error
        return buildClientRelations(
          clientId || '',
          (opportunities.data || []).map(mapClientOpportunityRelation),
          (orders.data || []).map(mapClientOrderRelation)
        )
      }
      const [opportunities, orders] = await Promise.all([
        pb.collection('opportunities').getFullList({
          sort: '-updated',
          filter: pb.filter('client = {:client}', { client: clientId }),
        }),
        pb.collection('channel_orders').getFullList({
          sort: '-updated',
          filter: pb.filter('client = {:client}', { client: clientId }),
        }),
      ])
      return buildClientRelations(
        clientId || '',
        opportunities.map(mapClientOpportunityRelation),
        orders.map(mapClientOrderRelation)
      )
    },
  })
}
