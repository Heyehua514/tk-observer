/** 商务驾驶舱跨表只读查询；权限：business 与 boss。 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { calculateBusinessDashboard } from './dashboard-metrics'
import {
  mapDashboardClient,
  mapDashboardOpportunity,
  mapDashboardOrder,
  mapDashboardSocialPlan,
} from './dashboard-source'
import type { BusinessDashboardData } from './types'

export const businessDashboardKey = ['business', 'dashboard'] as const

export function useBusinessDashboard() {
  return useQuery({
    queryKey: businessDashboardKey,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const [clients, opportunities, orders, socialPlans] = await Promise.all(
          [
            getSupabaseClient()
              .from('clients')
              .select('*')
              .is('deleted_at', null)
              .order('updated_at', { ascending: false }),
            getSupabaseClient()
              .from('opportunities')
              .select('*, clients(name)')
              .is('deleted_at', null)
              .order('updated_at', { ascending: false }),
            getSupabaseClient()
              .from('channel_orders')
              .select('*, clients(name)')
              .is('deleted_at', null)
              .order('updated_at', { ascending: false }),
            getSupabaseClient()
              .from('social_plans')
              .select('*')
              .is('deleted_at', null)
              .order('date'),
          ]
        )
        for (const result of [clients, opportunities, orders, socialPlans]) {
          if (result.error) throw result.error
        }
        return calculateBusinessDashboard({
          clients: (clients.data || []).map(mapDashboardClient),
          opportunities: (opportunities.data || []).map(
            mapDashboardOpportunity
          ),
          orders: (orders.data || []).map(mapDashboardOrder),
          socialPlans: (socialPlans.data || []).map(mapDashboardSocialPlan),
        })
      }
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
        clients: clients.map(mapDashboardClient),
        opportunities: opportunities.map(mapDashboardOpportunity),
        orders: orders.map(mapDashboardOrder),
        socialPlans: socialPlans.map(mapDashboardSocialPlan),
      }
      return calculateBusinessDashboard(data)
    },
  })
}
