/**
 * PocketBase 登录、退出和角色路由守卫。
 * 不记录 token、密码或用户对象，不向持久化存储写入认证数据。
 */
import { redirect } from '@tanstack/react-router'
import {
  roles,
  type AppUser,
  type UserRole,
  type WorkbenchPath,
} from '@/types/auth'
import { ClientResponseError, type RecordModel } from 'pocketbase'
import { useAuthStore } from '@/stores/auth-store'
import { clearPocketBaseSession, pb } from '@/lib/pocketbase'

export const ACCESS_DENIED_SESSION_KEY = 'tk-observer-access-denied'

export type LoginErrorCode = 'ACCOUNT_NOT_FOUND' | 'WRONG_PASSWORD' | 'NETWORK'

export type RegistrationErrorCode =
  | 'EMAIL_REGISTERED'
  | 'INVALID_INPUT'
  | 'INVALID_MEMBER'
  | 'MEMBER_REGISTERED'
  | 'NETWORK'

export class LoginError extends Error {
  constructor(public readonly code: LoginErrorCode) {
    super(code)
    this.name = 'LoginError'
  }
}

export class RegistrationError extends Error {
  constructor(public readonly code: RegistrationErrorCode) {
    super(code)
    this.name = 'RegistrationError'
  }
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && roles.some((role) => role === value)
}

function mapUser(record: RecordModel): AppUser {
  if (!isUserRole(record.role) || typeof record.name !== 'string') {
    throw new Error('账号角色配置无效，请联系管理员')
  }
  return {
    id: record.id,
    email: String(record.email || ''),
    name: record.name,
    role: record.role,
    avatar: typeof record.avatar === 'string' ? record.avatar : undefined,
  }
}

async function accountExists(email: string) {
  const result = await pb.send<{ exists: boolean }>(
    '/api/tk-observer/account-exists',
    {
      method: 'GET',
      query: { email },
    }
  )
  return result.exists
}

export async function loginWithPassword(email: string, password: string) {
  try {
    const result = await pb
      .collection('users')
      .authWithPassword(email.trim(), password)
    const user = mapUser(result.record)
    useAuthStore.getState().setUser(user)
    return user
  } catch (error) {
    clearPocketBaseSession()
    useAuthStore.getState().reset()

    if (!(error instanceof ClientResponseError) || error.status === 0) {
      throw new LoginError('NETWORK')
    }

    try {
      throw new LoginError(
        (await accountExists(email)) ? 'WRONG_PASSWORD' : 'ACCOUNT_NOT_FOUND'
      )
    } catch (lookupError) {
      if (lookupError instanceof LoginError) throw lookupError
      throw new LoginError('NETWORK')
    }
  }
}

type RegistrationInput = {
  email: string
  memberName: string
  password: string
  passwordConfirm: string
}

/**
 * 通过 PocketBase 内部注册端点创建固定成员账号，成功后立即登录。
 * role 不接受前端输入，由服务端根据成员姓名白名单确定。
 */
export async function registerAccount(input: RegistrationInput) {
  try {
    await pb.send('/api/tk-observer/register', {
      method: 'POST',
      body: {
        email: input.email.trim(),
        memberName: input.memberName,
        password: input.password,
        passwordConfirm: input.passwordConfirm,
      },
    })
    return await loginWithPassword(input.email, input.password)
  } catch (error) {
    if (error instanceof LoginError) {
      throw new RegistrationError(
        error.code === 'NETWORK' ? 'NETWORK' : 'INVALID_INPUT'
      )
    }
    if (!(error instanceof ClientResponseError) || error.status === 0) {
      throw new RegistrationError('NETWORK')
    }

    const code = error.response.code
    const validCodes: readonly RegistrationErrorCode[] = [
      'EMAIL_REGISTERED',
      'INVALID_INPUT',
      'INVALID_MEMBER',
      'MEMBER_REGISTERED',
    ]
    if (
      typeof code === 'string' &&
      validCodes.some((validCode) => validCode === code)
    ) {
      throw new RegistrationError(code as RegistrationErrorCode)
    }
    throw new RegistrationError('INVALID_INPUT')
  }
}

export function logout() {
  clearPocketBaseSession()
  useAuthStore.getState().reset()
}

export function getDefaultRoute(role: UserRole): WorkbenchPath {
  const routes: Record<UserRole, WorkbenchPath> = {
    boss: '/overview',
    business: '/business',
    market: '/market',
    design: '/design',
    editing: '/editing',
  }
  return routes[role]
}

export function requireAuthentication() {
  const user = useAuthStore.getState().user
  if (!user || !pb.authStore.isValid) throw redirect({ to: '/login' })
  return user
}

export function requireRoles(allowedRoles: readonly UserRole[]) {
  const user = requireAuthentication()
  if (user.role !== 'boss' && !allowedRoles.includes(user.role)) {
    sessionStorage.setItem(ACCESS_DENIED_SESSION_KEY, 'true')
    throw redirect({ to: getDefaultRoute(user.role) })
  }
  return user
}
