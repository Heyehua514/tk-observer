/**
 * 全局认证与角色类型。
 * role 值与 PocketBase users.role 选择字段保持严格一致。
 */
export const roles = [
  'owner',
  'boss',
  'business',
  'market',
  'design',
  'editing',
] as const

export type UserRole = (typeof roles)[number]

export type MemberOption = {
  name: string
  role: UserRole
  workbench: string
}

/**
 * 公司成员注册名单。
 * 这里只用于界面展示；服务端 registration hook 保存独立白名单并决定最终角色。
 */
export const memberOptions: readonly MemberOption[] = [
  { name: '磊哥', role: 'boss', workbench: '总览工作台' },
  { name: '董雨辰', role: 'business', workbench: '商务工作台' },
  { name: '韩素云', role: 'market', workbench: '市场工作台' },
  { name: '孙铭泽', role: 'design', workbench: '设计工作台' },
  { name: '谢洁', role: 'editing', workbench: '剪辑工作台' },
  { name: '杨振康', role: 'business', workbench: '商务工作台（测试）' },
] as const

export type AppUser = {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export type WorkbenchPath =
  '/overview' | '/business' | '/market' | '/design' | '/editing'
