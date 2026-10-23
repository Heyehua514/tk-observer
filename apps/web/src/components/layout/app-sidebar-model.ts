import type { UserRole } from '@/types/auth'
import { canAccessPath, type ProtectedAppPath } from '@/lib/route-access'

export function canSeeNavigationItem(
  role: UserRole,
  item: { to: ProtectedAppPath }
) {
  return canAccessPath(role, item.to)
}
