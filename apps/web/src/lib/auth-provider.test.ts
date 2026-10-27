/** Supabase 迁移认证分流自检；默认 provider 必须走 Supabase Auth。 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signUp = vi.fn()
const signOut = vi.fn()
const maybeSingle = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithPassword,
      signUp,
      signOut,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/pocketbase', () => ({
  clearPocketBaseSession: vi.fn(),
  pb: {
    authStore: { isValid: false },
    collection: vi.fn(),
    send: vi.fn(),
  },
}))

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  })
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('auth provider cutover', () => {
  it('logs in through Supabase when no provider override is set', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1', email: 'biz@example.com' } },
      error: null,
    })
    maybeSingle.mockResolvedValue({
      data: {
        name: '董雨辰',
        role: 'business',
        status: 'active',
        avatar_path: '',
      },
      error: null,
    })

    const { loginWithPassword } = await import('./auth')
    const user = await loginWithPassword('biz@example.com', 'password123')

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'biz@example.com',
      password: 'password123',
    })
    expect(user).toMatchObject({
      id: 'u1',
      email: 'biz@example.com',
      name: '董雨辰',
      role: 'business',
    })
  })

  it('registers through Supabase and relies on the email invitation for identity', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    signUp.mockResolvedValue({
      data: { user: { id: 'u2', email: 'design@example.com' } },
      error: null,
    })
    maybeSingle.mockResolvedValue({
      data: {
        name: '孙铭泽',
        role: 'design',
        status: 'active',
        avatar_path: '',
      },
      error: null,
    })

    const { registerAccount } = await import('./auth')
    const user = await registerAccount({
      email: 'design@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
    })

    expect(signUp).toHaveBeenCalledWith({
      email: 'design@example.com',
      password: 'password123',
      options: { data: {} },
    })
    expect(user.role).toBe('design')
  })

  it('rejects a login when the profile is still pending', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u3', email: 'pending@example.com' } },
      error: null,
    })
    maybeSingle.mockResolvedValue({
      data: {
        name: '待审成员',
        role: null,
        status: 'pending',
        avatar_path: '',
      },
      error: null,
    })

    const { loginWithPassword } = await import('./auth')
    await expect(
      loginWithPassword('pending@example.com', 'password123')
    ).rejects.toMatchObject({ code: 'ACCOUNT_PENDING' })
    expect(signOut).toHaveBeenCalled()
  })

  it('does not admit a registration until the invitation exists', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    signUp.mockResolvedValue({
      data: { user: { id: 'u4', email: 'new@example.com' } },
      error: null,
    })
    maybeSingle.mockResolvedValue({
      data: { name: '新成员', role: null, status: 'pending', avatar_path: '' },
      error: null,
    })

    const { registerAccount } = await import('./auth')
    await expect(
      registerAccount({
        email: 'new@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      })
    ).rejects.toMatchObject({ code: 'INVITE_REQUIRED' })
    expect(signOut).toHaveBeenCalled()
  })
})
