/** 商务工作台客户详情关联查询；读取商机和渠道商单。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import {
  buildClientRelations,
  type ClientOpportunityRelation,
  type ClientOrderRelation,
} from './client-relations'

const mapOpportunity = (record: RecordModel): ClientOpportunityRelation => ({
  id: record.id,
  client: String(record.client || ''),
  title: String(record.title || ''),
  amount: Number(record.amount || 0),
  stage: String(record.stage || ''),
  probability: Number(record.probability || 0),
})

const mapOrder = (record: RecordModel): ClientOrderRelation => ({
  id: record.id,
  client: String(record.client || ''),
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
        opportunities.map(mapOpportunity),
        orders.map(mapOrder)
      )
    },
  })
}
