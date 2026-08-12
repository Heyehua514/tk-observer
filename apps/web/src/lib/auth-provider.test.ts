/** Supabase 迁移认证分流自检；默认 provider 必须走 Supabase Auth。 */
import { afterEach, describe, expect, it, vi } from 'vitest'

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

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
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
      data: { name: '董雨辰', role: 'business', avatar_path: '' },
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

  it('registers through Supabase metadata and invitation flow', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    signUp.mockResolvedValue({
      data: { user: { id: 'u2', email: 'design@example.com' } },
      error: null,
    })
    maybeSingle.mockResolvedValue({
      data: { name: '孙铭泽', role: 'design', avatar_path: '' },
      error: null,
    })

    const { registerAccount } = await import('./auth')
    const user = await registerAccount({
      email: 'design@example.com',
      memberName: '孙铭泽',
      password: 'password123',
      passwordConfirm: 'password123',
    })

    expect(signUp).toHaveBeenCalledWith({
      email: 'design@example.com',
      password: 'password123',
      options: { data: { name: '孙铭泽' } },
    })
    expect(user.role).toBe('design')
  })
})
