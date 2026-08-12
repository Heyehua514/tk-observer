import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

describe('data provider environment', () => {
  it('uses Supabase as the default provider for the migration cutover', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    const { getDataProvider } = await import('./data-provider')
    expect(getDataProvider()).toBe('supabase')
  })

  it('requires URL and anon key only when Supabase is selected', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'supabase')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const { getSupabaseEnvironment } = await import('./data-provider')
    expect(() => getSupabaseEnvironment()).toThrow('Supabase环境变量未配置完整')
  })

  it('rejects unsupported provider names', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'firebase')
    vi.resetModules()
    const { getDataProvider } = await import('./data-provider')
    expect(() => getDataProvider()).toThrow('不支持的数据提供者')
  })
})
