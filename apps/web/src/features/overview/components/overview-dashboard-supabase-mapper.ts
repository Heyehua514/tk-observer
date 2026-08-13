/** 总览首页 Supabase 映射层；权限：boss 总览只读。 */
type Row = Record<string, unknown>

export type OverviewGmvMetric = {
  id: string
  metricDate: string
  amountMinor: number
}

export type OverviewTeamTask = {
  id: string
  assigneeName: string
  progress: number
}

export type OverviewAuditLog = {
  id: string
  actorName: string
  action: string
  created: string
}

export function mapSupabaseGmvMetric(record: Row): OverviewGmvMetric {
  return {
    id: String(record.id || ''),
    metricDate: String(record.metric_date || ''),
    amountMinor: Number(record.amount_minor || 0),
  }
}

export function mapSupabaseTeamTask(record: Row): OverviewTeamTask {
  return {
    id: String(record.id || ''),
    assigneeName: String(record.assignee_name || ''),
    progress: Number(record.progress || 0),
  }
}

export function mapSupabaseAuditLog(record: Row): OverviewAuditLog {
  return {
    id: String(record.id || ''),
    actorName: String(record.actor_name || ''),
    action: String(record.action || ''),
    created: String(record.created_at || ''),
  }
}
