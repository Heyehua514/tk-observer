import { expect, it } from 'vitest'
import config from '../../../../supabase/config.toml?raw'
import sql from '../../../../supabase/migrations/20260810000100_auth_foundation.sql?raw'
import storageSql from '../../../../supabase/migrations/20260810000200_storage_foundation.sql?raw'

it('keeps Supabase invitation-only and RLS protected', () => {
  expect(sql).toContain('alter table public.profiles enable row level security')
  expect(sql).not.toContain('service_role')
  expect(sql).not.toContain("raw_user_meta_data ->> 'role'")
  expect(config).toContain('enable_signup = false')
})

it('keeps every workspace bucket private and owner gated', () => {
  for (const bucket of [
    'avatars',
    'design-assets',
    'venue-photos',
    'event-materials',
    'finance-receipts',
  ]) {
    expect(storageSql).toContain(`'${bucket}'`)
  }
  expect(storageSql).toContain('for insert to authenticated\nwith check')
  expect(storageSql).not.toContain('public = true')
  expect(storageSql).toContain("public.has_any_role(array['owner'])")
})
