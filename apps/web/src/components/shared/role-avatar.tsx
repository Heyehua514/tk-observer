/** 统一角色头像：按姓名取后两字，颜色由工作台角色稳定映射。 */
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'
import { getRoleAvatarPresentation } from './role-avatar-utils'

export function RoleAvatar({
  name,
  role,
  className,
}: {
  name: string
  role: UserRole
  className?: string
}) {
  const presentation = getRoleAvatarPresentation(name, role)

  return (
    <span
      aria-label={`${name}的头像`}
      className={cn(
        'inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white',
        className
      )}
      style={{ backgroundColor: presentation.color }}
    >
      {presentation.label}
    </span>
  )
}
