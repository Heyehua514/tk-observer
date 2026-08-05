/**
 * 当前进程内的登录用户状态。
 * 不使用 persist 中间件，确保退出或重启不会留下上一位用户数据。
 */
import { roles, type AppUser } from '@/types/auth'
import { create } from 'zustand'

const USER_SESSION_KEY = 'tk-observer-user-session'

function loadSessionUser(): AppUser | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(USER_SESSION_KEY) || 'null'
    ) as unknown
    if (!value || typeof value !== 'object') return null
    const user = value as Partial<AppUser>
    if (
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.name !== 'string' ||
      !roles.some((role) => role === user.role)
    )
      return null
    return user as AppUser
  } catch {
    sessionStorage.removeItem(USER_SESSION_KEY)
    return null
  }
}

type AuthState = {
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadSessionUser(),
  setUser: (user) => {
    if (user) sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(USER_SESSION_KEY)
    set({ user })
  },
  reset: () => {
    sessionStorage.removeItem(USER_SESSION_KEY)
    set({ user: null })
  },
}))
