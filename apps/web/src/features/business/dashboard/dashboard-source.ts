/** 商务驾驶舱数据源映射；兼容 Supabase/PocketBase。 */
import type { OpportunityStage } from '../opportunities'
import type {
  DashboardClient,
  DashboardOpportunity,
  DashboardOrder,
  DashboardSocialPlan,
} from './types'

const relatedName = (record: Record<string, unknown>) => {
  const expand = record.expand as { client?: { name?: unknown } } | undefined
  const client = (record.clients || expand?.client) as { name?: unknown } | undefined
  return String(client?.name || '未知客户')
}

export function mapDashboardClient(
  record: Record<string, unknown>
): DashboardClient {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    created: String(record.created_at || record.created || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function mapDashboardOpportunity(
  record: Record<string, unknown>
): DashboardOpportunity {
  return {
    id: String(record.id || ''),
    clientName: relatedName(record),
    title: String(record.title || ''),
    amount: Number(record.amount || 0),
    stage: record.stage as OpportunityStage,
    probability: Number(record.probability || 0),
    expectedClose: String(record.expected_close || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function mapDashboardOrder(
  record: Record<string, unknown>
): DashboardOrder {
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    clientName: relatedName(record),
    amount: Number(record.amount || 0),
    status: String(record.status || ''),
    publishDate: String(record.publish_date || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

export function mapDashboardSocialPlan(
  record: Record<string, unknown>
): DashboardSocialPlan {
  return {
    id: String(record.id || ''),
    content: String(record.content || ''),
    date: String(record.date || ''),
    status: String(record.status || ''),
  }
}
