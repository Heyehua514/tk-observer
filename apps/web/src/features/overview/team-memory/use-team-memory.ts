/** 总览工作台团队记忆跨表查询；权限：boss。 */
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { calculateTeamMemoryMetrics } from './team-memory-metrics'
import type { TeamMemoryData, TeamMemoryFailedCase } from './types'

export function beijingBoundary(now: Date, kind: 'day' | 'month' | 'week') {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const year = shifted.getUTCFullYear()
  const month = shifted.getUTCMonth()
  const date = shifted.getUTCDate()
  const localStart =
    kind === 'month'
      ? Date.UTC(year, month, 1)
      : kind === 'week'
        ? Date.UTC(year, month, date - ((shifted.getUTCDay() + 6) % 7))
        : Date.UTC(year, month, date)
  return new Date(localStart - 8 * 60 * 60 * 1000).toISOString()
}

export function useTeamMemory() {
  return useQuery({
    queryKey: ['overview', 'team-memory'],
    queryFn: async (): Promise<TeamMemoryData> => {
      const now = new Date()
      const monthStart = beijingBoundary(now, 'month')
      const weekStart = beijingBoundary(now, 'week')
      const todayStart = beijingBoundary(now, 'day')
      const [daily, failedCases, cronRuns, templates] = await Promise.all([
        pb.collection('daily_reports').getList(1, 1, {
          filter: `date >= "${todayStart}"`,
          sort: '-date',
        }),
        pb.collection('failed_cases').getFullList({
          filter: `recorded_at >= "${monthStart}"`,
          sort: '-recorded_at',
        }),
        pb.collection('audit_logs').getFullList({
          filter: `entity_type = "cron_run" && created >= "${weekStart}"`,
        }),
        pb.collection('event_templates').getFullList({ sort: '-usage_count' }),
      ])
      const cases: TeamMemoryFailedCase[] = failedCases.map((record) => ({
        id: record.id,
        reason: String(record.reason || ''),
        recordedAt: String(record.recorded_at || ''),
      }))
      const metrics = calculateTeamMemoryMetrics(
        cases,
        cronRuns.length,
        templates.map((record) => Number(record.usage_count || 0)),
        now
      )
      const report = daily.items[0]
      return {
        ...metrics,
        dailyHighlight: String(report?.highlights || ''),
        dailyDate: String(report?.date || ''),
      }
    },
  })
}
