import { roles, type UserRole } from '@/types/auth'

/** 工作台路径的唯一角色权限契约，路由守卫与侧边栏均消费此表。 */
export const WORKBENCH_ROLE_MATRIX = {
  '/overview': ['boss'],
  '/overview/calendar': ['boss'],
  '/business': ['business'],
  '/market': ['market'],
  '/design': ['design', 'business'],
  '/editing': ['editing', 'business'],
} as const satisfies Record<string, readonly UserRole[]>

/** 所有有效登录角色都可访问的共享应用路径。 */
export const SHARED_AUTHENTICATED_PATHS = [
  '/intelligence',
  '/search',
  '/notifications',
  '/settings',
] as const

export type WorkbenchAccessPath = keyof typeof WORKBENCH_ROLE_MATRIX
export type SharedAuthenticatedPath =
  (typeof SHARED_AUTHENTICATED_PATHS)[number]
export type ProtectedAppPath = WorkbenchAccessPath | SharedAuthenticatedPath

export function isSharedAuthenticatedPath(
  path: string
): path is SharedAuthenticatedPath {
  return SHARED_AUTHENTICATED_PATHS.some((candidate) => candidate === path)
}

export function getRouteRoles(path: ProtectedAppPath): readonly UserRole[] {
  if (isSharedAuthenticatedPath(path)) return roles
  return WORKBENCH_ROLE_MATRIX[path]
}

/** owner/boss 保留全局监督权限，其余角色严格按矩阵判断。 */
export function canRoleAccess(
  role: UserRole,
  allowedRoles: readonly UserRole[]
): boolean {
  return role === 'owner' || role === 'boss' || allowedRoles.includes(role)
}

export function canAccessPath(role: UserRole, path: ProtectedAppPath): boolean {
  return canRoleAccess(role, getRouteRoles(path))
}
