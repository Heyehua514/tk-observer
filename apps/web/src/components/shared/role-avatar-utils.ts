import type { UserRole } from '@/types/auth'

const roleColors: Record<UserRole, string> = {
  owner: 'bg-emerald-500',
  boss: '#3B82F6',
  business: '#8B5CF6',
  market: '#10B981',
  design: '#F59E0B',
  editing: '#EC4899',
}

export function getRoleAvatarPresentation(name: string, role: UserRole) {
  const normalizedName = name.trim() || '成员'
  return {
    label: [...normalizedName].slice(-2).join(''),
    color: roleColors[role],
  }
}
