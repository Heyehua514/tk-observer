import { expect, it } from 'vitest'
import config from '../../../../supabase/config.toml?raw'
import sql from '../../../../supabase/migrations/20260810000100_auth_foundation.sql?raw'

it('keeps Supabase invitation-only and RLS protected', () => {
  expect(sql).toContain('alter table public.profiles enable row level security')
  expect(sql).not.toContain('service_role')
  expect(sql).not.toContain("raw_user_meta_data ->> 'role'")
  expect(config).toContain('enable_signup = false')
})
