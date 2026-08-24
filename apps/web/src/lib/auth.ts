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
import { getDataProvider } from '@/lib/data-provider'
import { clearPocketBaseSession, pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'

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

type SupabaseProfile = {
  name: string
  role: string | null
  avatar_path: string | null
}

function mapSupabaseUser(
  id: string,
  email: string | undefined,
  profile: SupabaseProfile | null
): AppUser {
  if (!profile || !isUserRole(profile.role) || !profile.name) {
    throw new Error('账号角色配置无效，请联系管理员')
  }
  return {
    id,
    email: email || '',
    name: profile.name,
    role: profile.role,
    avatar: profile.avatar_path || undefined,
  }
}

async function fetchSupabaseProfile(userId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('name, role, avatar_path')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as SupabaseProfile | null
}

async function loginWithSupabasePassword(email: string, password: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error || !data.user) throw error || new Error('NO_USER')
    const profile = await fetchSupabaseProfile(data.user.id)
    const user = mapSupabaseUser(data.user.id, data.user.email, profile)
    useAuthStore.getState().setUser(user)
    return user
  } catch {
    useAuthStore.getState().reset()
    throw new LoginError('NETWORK')
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
  if (getDataProvider() === 'supabase') {
    return loginWithSupabasePassword(email, password)
  }

  try {
    const result = await pb
      .collection('users')
      .authWithPassword(email.trim(), password)
    const user = mapUser(result.record)
    useAuthStore.getState().setUser(user)
    return user
  } catch (error) {
    await clearPocketBaseSession()
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
  if (getDataProvider() === 'supabase') {
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: { data: { name: input.memberName } },
      })
      if (error || !data.user) throw error || new Error('NO_USER')
      const profile = await fetchSupabaseProfile(data.user.id)
      const user = mapSupabaseUser(data.user.id, data.user.email, profile)
      useAuthStore.getState().setUser(user)
      return user
    } catch {
      useAuthStore.getState().reset()
      throw new RegistrationError('NETWORK')
    }
  }

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

export type ChangePasswordErrorCode =
  'WEAK_PASSWORD' | 'WRONG_PASSWORD' | 'NETWORK'

export class ChangePasswordError extends Error {
  constructor(public readonly code: ChangePasswordErrorCode) {
    super(code)
    this.name = 'ChangePasswordError'
  }
}

/**
 * 修改当前登录账号密码。
 * Supabase：校验当前密码后更新；PocketBase：更新当前用户记录。
 */
export async function changeCurrentPassword(
  currentPassword: string,
  newPassword: string
) {
  if (getDataProvider() === 'supabase') {
    const supabase = getSupabaseClient()
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: useAuthStore.getState().user?.email || '',
        password: currentPassword,
      })
      if (verifyError) throw new ChangePasswordError('WRONG_PASSWORD')
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw new ChangePasswordError('NETWORK')
      return
    } catch (error) {
      if (error instanceof ChangePasswordError) throw error
      throw new ChangePasswordError('NETWORK')
    }
  }

  try {
    await pb.collection('users').update(pb.authStore.model?.id || '', {
      password: newPassword,
      passwordConfirm: newPassword,
    })
  } catch {
    throw new ChangePasswordError('NETWORK')
  }
}

export async function logout() {
  if (getDataProvider() === 'supabase') {
    await getSupabaseClient().auth.signOut()
    useAuthStore.getState().reset()
    return
  }
  await clearPocketBaseSession()
  useAuthStore.getState().reset()
}

export function getDefaultRoute(role: UserRole): WorkbenchPath {
  const routes: Record<UserRole, WorkbenchPath> = {
    owner: '/overview',
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
  if (!user) throw redirect({ to: '/login' })
  if (getDataProvider() === 'pocketbase' && !pb.authStore.isValid) {
    throw redirect({ to: '/login' })
  }
  return user
}

export function requireRoles(allowedRoles: readonly UserRole[]) {
  const user = requireAuthentication()
  if (user.role !== 'owner' && user.role !== 'boss' && !allowedRoles.includes(user.role)) {
    sessionStorage.setItem(ACCESS_DENIED_SESSION_KEY, 'true')
    throw redirect({ to: getDefaultRoute(user.role) })
  }
  return user
}
