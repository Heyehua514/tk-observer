/**
 * 非阻断式业务审计写入。
 * mutation 成功后调用；审计失败不会把已完成的主业务操作误报为失败。
 */
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'

export function buildAuditPayload({
  actorName,
  action,
  entityType,
  entityId,
}: {
  actorName: string
  action: string
  entityType: string
  entityId: string
}) {
  return {
    actor_name: actorName,
    action,
    entity_type: entityType,
    entity_id: entityId,
  }
}

export function recordAudit(
  action: string,
  entityType: string,
  entityId: string
) {
  const user = useAuthStore.getState().user
  if (!user) return
  const payload = buildAuditPayload({
    actorName: user.name,
    action,
    entityType,
    entityId,
  })
  if (getDataProvider() === 'supabase') {
    void Promise.resolve(
      getSupabaseClient().from('audit_logs').insert(payload)
    ).catch(() => undefined)
    return
  }
  void pb
    .collection('audit_logs')
    .create(payload)
    .catch(() => undefined)
}
