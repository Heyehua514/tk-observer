/** 商务驾驶舱跨表只读查询；权限：business 与 boss。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import type { OpportunityStage } from '../opportunities'
import { calculateBusinessDashboard } from './dashboard-metrics'
import type { BusinessDashboardData } from './types'

export const businessDashboardKey = ['business', 'dashboard'] as const

export function useBusinessDashboard() {
  return useQuery({
    queryKey: businessDashboardKey,
    queryFn: async () => {
      const [clients, opportunities, orders, socialPlans] = await Promise.all([
        pb.collection('clients').getFullList({ sort: '-updated' }),
        pb
          .collection('opportunities')
          .getFullList({ sort: '-updated', expand: 'client' }),
        pb
          .collection('channel_orders')
          .getFullList({ sort: '-updated', expand: 'client' }),
        pb.collection('social_plans').getFullList({ sort: 'date' }),
      ])
      const data: BusinessDashboardData = {
        clients: clients.map((record: RecordModel) => ({
          id: record.id,
          name: String(record.name || ''),
          created: String(record.created || ''),
          updated: String(record.updated || ''),
        })),
        opportunities: opportunities.map((record: RecordModel) => ({
          id: record.id,
          clientName: String(record.expand?.client?.name || '未知客户'),
          title: String(record.title || ''),
          amount: Number(record.amount || 0),
          stage: record.stage as OpportunityStage,
          probability: Number(record.probability || 0),
          expectedClose: String(record.expected_close || ''),
          updated: String(record.updated || ''),
        })),
        orders: orders.map((record: RecordModel) => ({
          id: record.id,
          title: String(record.title || ''),
          clientName: String(record.expand?.client?.name || '未知客户'),
          amount: Number(record.amount || 0),
          status: String(record.status || ''),
          publishDate: String(record.publish_date || ''),
          updated: String(record.updated || ''),
        })),
        socialPlans: socialPlans.map((record: RecordModel) => ({
          id: record.id,
          content: String(record.content || ''),
          date: String(record.date || ''),
          status: String(record.status || ''),
        })),
      }
      return calculateBusinessDashboard(data)
    },
  })
}
