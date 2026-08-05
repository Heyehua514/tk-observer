/**
 * 非阻断式业务审计写入。
 * mutation 成功后调用；审计失败不会把已完成的主业务操作误报为失败。
 */
import { useAuthStore } from '@/stores/auth-store'
import { pb } from '@/lib/pocketbase'

export function recordAudit(
  action: string,
  entityType: string,
  entityId: string
) {
  const user = useAuthStore.getState().user
  if (!user) return
  void pb
    .collection('audit_logs')
    .create({
      actor_name: user.name,
      action,
      entity_type: entityType,
      entity_id: entityId,
    })
    .catch(() => undefined)
}
