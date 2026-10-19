/**
 * 跨境出海全主链路流水线指标查询 Hook
 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import {
  calculatePipelineSummary,
  DEFAULT_PIPELINE_COUNTS,
  type PipelineSummary,
  type RawPipelineCounts,
} from './cross-domain-stats'

export const crossDomainKeys = {
  all: ['cross-domain'] as const,
  pipelineSummary: () => [...crossDomainKeys.all, 'pipeline-summary'] as const,
}

export function useCrossDomainPipelineStats() {
  return useQuery<PipelineSummary>({
    queryKey: crossDomainKeys.pipelineSummary(),
    queryFn: async (): Promise<PipelineSummary> => {
      const isSupabase = getDataProvider() === 'supabase'
      if (!isSupabase) {
        return calculatePipelineSummary(DEFAULT_PIPELINE_COUNTS)
      }

      try {
        const client = getSupabaseClient()
        const [
          radarRes,
          productsRes,
          creatorsRes,
          tasksRes,
          schedulesRes,
          metricsRes,
        ] = await Promise.all([
          client
            .from('product_radars')
            .select('id, heat_score, is_added_to_products')
            .is('deleted_at', null),
          client
            .from('products')
            .select('id, status')
            .is('deleted_at', null),
          client
            .from('creators')
            .select('id, cooperation_status')
            .is('deleted_at', null),
          client
            .from('video_tasks')
            .select('id, status')
            .is('deleted_at', null),
          client
            .from('publish_schedules')
            .select('id, status')
            .is('deleted_at', null),
          client
            .from('video_metrics_logs')
            .select('id, views, conversion_gmv_cents')
            .is('deleted_at', null),
        ])

        const radarData = radarRes.data || []
        const productsData = productsRes.data || []
        const creatorsData = creatorsRes.data || []
        const tasksData = tasksRes.data || []
        const schedulesData = schedulesRes.data || []
        const metricsData = metricsRes.data || []

        const counts: RawPipelineCounts = {
          radarTotal: radarData.length,
          radarAdded: radarData.filter((i) => i.is_added_to_products).length,
          radarExplosive: radarData.filter((i) => Number(i.heat_score || 0) >= 85).length,
          productsTotal: productsData.length,
          productsActive: productsData.filter((i) => i.status === 'active').length,
          creatorsTotal: creatorsData.length,
          creatorsSigned: creatorsData.filter((i) => i.cooperation_status === 'signed').length,
          creatorsContacting: creatorsData.filter((i) => i.cooperation_status === 'contacting').length,
          videoTasksTotal: tasksData.length,
          videoTasksInProgress: tasksData.filter((i) => i.status === 'editing' || i.status === 'review').length,
          videoTasksDone: tasksData.filter((i) => i.status === 'done').length,
          schedulesTotal: schedulesData.length,
          schedulesPending: schedulesData.filter((i) => i.status === 'scheduled').length,
          viralVideosCount: metricsData.filter((i) => Number(i.views || 0) >= 10000 || Number(i.conversion_gmv_cents || 0) >= 500000).length,
        }

        return calculatePipelineSummary(counts)
      } catch {
        return calculatePipelineSummary(DEFAULT_PIPELINE_COUNTS)
      }
    },
    staleTime: 60 * 1000,
  })
}
