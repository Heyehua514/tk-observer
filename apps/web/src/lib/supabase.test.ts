import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

it('does not require Supabase variables until the client is requested', async () => {
  vi.stubEnv('VITE_DATA_PROVIDER', 'pocketbase')
  vi.stubEnv('VITE_SUPABASE_URL', '')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
  vi.resetModules()
  await expect(import('./supabase')).resolves.toBeDefined()
})

it('creates one typed client per browser session', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'local-anon-key')
  vi.resetModules()
  const { getSupabaseClient } = await import('./supabase')
  expect(getSupabaseClient()).toBe(getSupabaseClient())
})
