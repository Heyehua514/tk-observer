import type { UserRole } from '@/types/auth'

export function canSeeNavigationItem(
  role: UserRole,
  item: { role: UserRole; to: string }
) {
  if (item.to === '/intelligence') return true
  return role === 'owner' || role === 'boss' || role === item.role
}
