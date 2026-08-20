/**
 * C2 · 状态历史读取与协作看板聚合模型。
 * 读取 status_history 表中某实体的最近变更，供详情/看板展示“最近协作动作”。
 * 所属工作台：商务 + 协作。
 */
import { useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'

export type StatusChange = {
  id: string
  entityType: string
  entityId: string
  fromStatus: string | null
  toStatus: string
  actorName: string
  created: string
}

export const statusHistoryKeys = {
  all: ['status-history'] as const,
  entity: (type: string, id: string) =>
    [...statusHistoryKeys.all, type, id] as const,
}

type Builder = Record<string, unknown> & {
  eq: (c: string, v: string) => Builder
  is: (c: string, v: null) => Builder
  order: (c: string, o: { ascending: boolean }) => Builder
  limit: (n: number) => Builder
}

export function useStatusHistory(entityType: string, entityId: string) {
  return useQuery({
    queryKey: statusHistoryKeys.entity(entityType, entityId),
    queryFn: async (): Promise<StatusChange[]> => {
      const mapRow = (r: Record<string, unknown>): StatusChange => ({
        id: String(r.id || ''),
        entityType: String(r.entity_type || ''),
        entityId: String(r.entity_id || ''),
        fromStatus: r.from_status ? String(r.from_status) : null,
        toStatus: String(r.to_status || ''),
        actorName: String(r.actor_name || ''),
        created: String(r.created_at || r.created || ''),
      })

      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const db = supabase as unknown as {
          from: (t: string) => { select: (c: string) => unknown }
        }
        let builder = db
          .from('status_history')
          .select(
            'id,entity_type,entity_id,from_status,to_status,actor_name,created_at'
          ) as unknown as Builder
        builder = builder
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20)
        const result = (await (builder as unknown as Promise<{
          data: Record<string, unknown>[] | null
          error: { message: string } | null
        }>)) as {
          data: Record<string, unknown>[] | null
          error: { message: string } | null
        }
        if (result.error) throw result.error
        return (result.data || []).map(mapRow)
      }

      const records = await pb.collection('status_history').getFullList({
        filter: pb.filter('entity_type = {:t} && entity_id = {:id}', {
          t: entityType,
          id: entityId,
        }),
        sort: '-created',
      })
      return records.map((rec) =>
        mapRow(rec as unknown as Record<string, unknown>)
      )
    },
  })
}

/** 把 from/to 状态转成可读标签（按实体类型）。 */
export function statusLabel(entityType: string, value: string | null): string {
  if (!value) return '—'
  const labels: Record<string, Record<string, string>> = {
    opportunity: {
      contact: '初步接洽',
      proposal: '方案报价',
      negotiation: '商务谈判',
      contract: '合同签署',
      won: '已成交',
      lost: '已流失',
    },
    order: {
      negotiating: '洽谈中',
      confirmed: '已确认',
      shooting: '拍摄中',
      published: '已发布',
      completed: '已完成',
      cancelled: '已取消',
    },
  }
  return labels[entityType]?.[value] ?? value
}
