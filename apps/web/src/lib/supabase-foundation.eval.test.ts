import { expect, it } from 'vitest'
import config from '../../../../supabase/config.toml?raw'
import sql from '../../../../supabase/migrations/20260810000100_auth_foundation.sql?raw'
import storageSql from '../../../../supabase/migrations/20260810000200_storage_foundation.sql?raw'
import admissionSql from '../../../../supabase/migrations/20261027000100_member_admission_workflow.sql?raw'

it('keeps Supabase invitation-only and RLS protected', () => {
  expect(sql).toContain('alter table public.profiles enable row level security')
  expect(sql).not.toContain('service_role')
  expect(sql).not.toContain("raw_user_meta_data ->> 'role'")
  expect(config).toContain('enable_signup = true')
})

it('activates invited pending accounts without trusting role metadata', () => {
  expect(admissionSql).toContain('public.link_invitation_to_pending_profile')
  expect(admissionSql).toContain('approved_at = now()')
  expect(admissionSql).not.toContain("raw_user_meta_data ->> 'role'")
})

it('keeps every workspace bucket private and owner gated', () => {
  const normalizedStorageSql = storageSql.replace(/\r\n/g, '\n')

  for (const bucket of [
    'avatars',
    'design-assets',
    'venue-photos',
    'event-materials',
    'finance-receipts',
  ]) {
    expect(normalizedStorageSql).toContain(`'${bucket}'`)
  }
  expect(normalizedStorageSql).toContain(
    'for insert to authenticated\nwith check'
  )
  expect(normalizedStorageSql).not.toContain('public = true')
  expect(normalizedStorageSql).toContain("public.has_any_role(array['owner'])")
})
