# Supabase Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tested Supabase foundation beside PocketBase without changing the active production data provider.

**Architecture:** The repository gains a local Supabase project, invitation-backed member profiles, role helpers, private Storage buckets, generated database types, and a lazy frontend client. `VITE_DATA_PROVIDER` remains `pocketbase` by default, so this phase cannot cut over live workflows. A deterministic inventory script captures the current PocketBase schema for later workspace migrations.

**Tech Stack:** Supabase CLI, PostgreSQL 15, pgTAP, `@supabase/supabase-js`, React 18, Vite 8, TypeScript 6, Vitest Browser, Node.js scripts.

## Global Constraints

- Do not modify any existing PocketBase migration or delete PocketBase data.
- Do not switch the default data provider away from PocketBase in this plan.
- Do not introduce Express, NestJS, Django, Redux, or MobX.
- Do not store Supabase secrets, user passwords, access tokens, or `service_role` keys in Git.
- Use append-only SQL migrations under `supabase/migrations/`.
- Use UUID primary keys and retain PocketBase IDs later as unique `legacy_id` values.
- Keep public signup disabled; member access is invitation-backed and owner-controlled.
- Every table and Storage bucket created here must enable RLS before the task is committed.
- Every production change requires a failing gate test first and a matching eval contract.
- Keep unrelated existing worktree changes unstaged.

## Scope Boundary

This plan stops after the parallel Supabase foundation is green while PocketBase remains active. The approved design requires separate implementation plans for:

1. Workspace SQL schemas, per-role RLS, feature hooks, and Realtime.
2. Cron, Edge Functions, AI jobs, and Tauri WorkBuddy workers.
3. Data and file migration rehearsal, consistency reports, cutover, and rollback drill.
4. PWA delivery, temporary Cloudflare deployment, and mobile upload flows.
5. The front-end structural redesign after the final data contract is stable.

None of these follow-on plans may switch the production provider until the cutover plan's acceptance checks pass.

---

## File Structure

```text
supabase/
├── config.toml                              Local Supabase configuration
├── migrations/
│   ├── 20260810000100_auth_foundation.sql  Profiles, invitations, role helpers
│   └── 20260810000200_storage_foundation.sql Private buckets and base policies
└── tests/
    ├── auth_foundation.test.sql             pgTAP role and RLS tests
    └── storage_foundation.test.sql          pgTAP bucket and policy tests

scripts/supabase/
├── export-pocketbase-schema.mjs             Export temporary PocketBase schema JSON
├── schema-inventory.mjs                     Normalize collection metadata
└── schema-inventory.test.mjs                Deterministic mapper tests

apps/web/
├── .env.example                             Non-secret environment contract
└── src/
    ├── lib/data-provider.ts                 Provider selection and validation
    ├── lib/data-provider.test.ts            Environment contract tests
    ├── lib/supabase.ts                      Lazy Supabase browser client
    ├── lib/supabase.test.ts                 Singleton and configuration tests
    ├── lib/supabase-foundation.eval.test.ts Security contract eval
    ├── types/database.generated.ts          Generated local database types
    └── vite-env.d.ts                        Typed Vite environment variables

docs/supabase/local-development.md            Local commands and secret handling
```

---

### Task 1: Install Supabase Tooling and Define the Environment Contract

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/web/package.json`
- Create: `apps/web/.env.example`
- Modify: `apps/web/src/vite-env.d.ts`
- Create: `apps/web/src/lib/data-provider.test.ts`
- Create: `apps/web/src/lib/data-provider.ts`

**Interfaces:**
- Produces: `DataProvider = 'pocketbase' | 'supabase'`.
- Produces: `getDataProvider(): DataProvider`.
- Produces: `getSupabaseEnvironment(): { url: string; anonKey: string }`.
- Consumes: Vite variables `VITE_DATA_PROVIDER`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Write failing provider contract tests**

Create `apps/web/src/lib/data-provider.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

describe('data provider environment', () => {
  it('keeps PocketBase as the default provider', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', '')
    vi.resetModules()
    const { getDataProvider } = await import('./data-provider')
    expect(getDataProvider()).toBe('pocketbase')
  })

  it('requires URL and anon key only when Supabase is selected', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'supabase')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const { getSupabaseEnvironment } = await import('./data-provider')
    expect(() => getSupabaseEnvironment()).toThrow(
      'Supabase环境变量未配置完整'
    )
  })

  it('rejects unsupported provider names', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'firebase')
    vi.resetModules()
    const { getDataProvider } = await import('./data-provider')
    expect(() => getDataProvider()).toThrow('不支持的数据提供者')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --dir apps/web exec vitest run --browser.headless src/lib/data-provider.test.ts`

Expected: FAIL because `src/lib/data-provider.ts` does not exist.

- [ ] **Step 3: Install only the official dependencies**

Run:

```bash
pnpm add -Dw supabase
pnpm --dir apps/web add @supabase/supabase-js
```

Do not remove the `pocketbase` dependency during this phase.

- [ ] **Step 4: Implement provider validation**

Create `apps/web/src/lib/data-provider.ts`:

```ts
export type DataProvider = 'pocketbase' | 'supabase'

export function getDataProvider(): DataProvider {
  const value = import.meta.env.VITE_DATA_PROVIDER || 'pocketbase'
  if (value !== 'pocketbase' && value !== 'supabase') {
    throw new Error(`不支持的数据提供者：${value}`)
  }
  return value
}

export function getSupabaseEnvironment() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) throw new Error('Supabase环境变量未配置完整')
  return { url, anonKey }
}
```

Add to `apps/web/src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: 'pocketbase' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

Create `apps/web/.env.example`:

```dotenv
VITE_DATA_PROVIDER=pocketbase
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm --dir apps/web exec vitest run --browser.headless src/lib/data-provider.test.ts
pnpm typecheck
```

Expected: 3 tests PASS and typecheck exits 0.

- [ ] **Step 6: Commit the tooling boundary**

```bash
git add package.json pnpm-lock.yaml apps/web/package.json apps/web/.env.example apps/web/src/vite-env.d.ts apps/web/src/lib/data-provider.ts apps/web/src/lib/data-provider.test.ts
git commit -m "chore(supabase): add provider tooling"
```

---

### Task 2: Create Invitation-Backed Profiles and RLS Helpers

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260810000100_auth_foundation.sql`
- Create: `supabase/tests/auth_foundation.test.sql`
- Create: `apps/web/src/lib/supabase-foundation.eval.test.ts`

**Interfaces:**
- Produces: `public.profiles`, `public.member_invitations`.
- Produces: `public.current_user_role()`, `public.current_user_status()`, `public.has_any_role(text[])`.
- Produces: trigger `public.handle_new_auth_user()` on `auth.users`.
- Consumes: Supabase `auth.uid()` and verified invitation email.

- [ ] **Step 1: Initialize the local project without starting services**

Run: `pnpm exec supabase init`

Edit `supabase/config.toml` so public signup is disabled and the local API uses the standard local ports. The auth section must contain:

```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
enable_signup = false
```

- [ ] **Step 2: Write the failing pgTAP security test**

Create `supabase/tests/auth_foundation.test.sql` with these assertions:

```sql
begin;
select plan(12);

select has_table('public', 'profiles');
select has_table('public', 'member_invitations');
select has_function('public', 'current_user_role', array[]::text[]);
select has_function('public', 'current_user_status', array[]::text[]);
select has_function('public', 'has_any_role', array['text[]']);
select policies_are('public', 'profiles', array[
  'active members can read active profiles',
  'owners can manage profiles'
]);
select policies_are('public', 'member_invitations', array[
  'owners can read invitations',
  'owners can create invitations',
  'owners can update invitations'
]);
select col_is_pk('public', 'profiles', 'id');
select col_is_fk('public', 'profiles', 'id');
select col_is_unique('public', 'member_invitations', 'email');
select has_column('public', 'profiles', 'legacy_id');
select trigger_is(
  'auth', 'users', 'on_auth_user_created',
  'public', 'handle_new_auth_user'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Run the SQL test and verify RED**

Run:

```bash
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase test db supabase/tests/auth_foundation.test.sql
```

Expected: FAIL because the profile tables and functions are absent.

- [ ] **Step 4: Implement the auth foundation migration**

Create `supabase/migrations/20260810000100_auth_foundation.sql` with:

```sql
create extension if not exists citext with schema extensions;

create table public.member_invitations (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  name text not null check (char_length(name) between 1 and 80),
  role text not null check (role in ('owner','boss','business','market','design','editing')),
  status text not null default 'invited' check (status in ('invited','accepted','revoked','expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 80),
  role text check (role in ('owner','boss','business','market','design','editing')),
  status text not null default 'pending' check (status in ('invited','pending','active','disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  avatar_path text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.member_invitations enable row level security;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() and status = 'active' $$;

create or replace function public.current_user_status()
returns text language sql stable security definer set search_path = ''
as $$ select status from public.profiles where id = auth.uid() $$;

create or replace function public.has_any_role(required_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_user_role() = any(required_roles), false) $$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_status() from public;
revoke all on function public.has_any_role(text[]) from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_status() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;

create policy "active members can read active profiles" on public.profiles
for select to authenticated
using (status = 'active' and public.current_user_status() = 'active');

create policy "owners can manage profiles" on public.profiles
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create policy "owners can read invitations" on public.member_invitations
for select to authenticated using (public.has_any_role(array['owner']));
create policy "owners can create invitations" on public.member_invitations
for insert to authenticated with check (public.has_any_role(array['owner']));
create policy "owners can update invitations" on public.member_invitations
for update to authenticated using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare invitation public.member_invitations;
begin
  select * into invitation
  from public.member_invitations
  where email = new.email
    and status = 'invited'
    and expires_at > now()
  for update;

  if found then
    insert into public.profiles (id, name, role, status, invited_by)
    values (new.id, invitation.name, invitation.role, 'active', invitation.invited_by);
    update public.member_invitations
    set status = 'accepted', accepted_at = now(), updated_at = now()
    where id = invitation.id;
  else
    insert into public.profiles (id, name, status)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'name', '待审批成员'), 'pending');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
```

Append the timestamp function and triggers in the same migration:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger invitations_set_updated_at
before update on public.member_invitations
for each row execute function public.set_updated_at();
```

- [ ] **Step 5: Add the matching security eval**

Create `apps/web/src/lib/supabase-foundation.eval.test.ts` using separate `?raw` imports of the migration and config:

```ts
import { expect, it } from 'vitest'
import config from '../../../../supabase/config.toml?raw'
import sql from '../../../../supabase/migrations/20260810000100_auth_foundation.sql?raw'

it('keeps Supabase invitation-only and RLS protected', () => {
expect(sql).toContain('alter table public.profiles enable row level security')
expect(sql).not.toContain('service_role')
expect(sql).not.toContain('raw_user_meta_data ->> \'role\'')
expect(config).toContain('enable_signup = false')
})
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
pnpm exec supabase db reset
pnpm exec supabase test db supabase/tests/auth_foundation.test.sql
pnpm --dir apps/web exec vitest run --browser.headless src/lib/supabase-foundation.eval.test.ts
```

Expected: pgTAP reports 12 passing assertions and the eval passes.

- [ ] **Step 7: Commit the auth foundation**

```bash
git add supabase/config.toml supabase/migrations/20260810000100_auth_foundation.sql supabase/tests/auth_foundation.test.sql apps/web/src/lib/supabase-foundation.eval.test.ts
git commit -m "feat(supabase): add invitation auth foundation"
```

---

### Task 3: Create Private Storage Buckets and Deny-by-Default Policies

**Files:**
- Create: `supabase/migrations/20260810000200_storage_foundation.sql`
- Create: `supabase/tests/storage_foundation.test.sql`
- Modify: `apps/web/src/lib/supabase-foundation.eval.test.ts`

**Interfaces:**
- Produces private buckets: `avatars`, `design-assets`, `venue-photos`, `event-materials`, `finance-receipts`.
- Produces owner-only base policies; workspace-specific policies are appended with each feature migration.
- Consumes: `public.has_any_role(text[])` from Task 2.

- [ ] **Step 1: Write the failing bucket test**

Create `supabase/tests/storage_foundation.test.sql`:

```sql
begin;
select plan(7);
select is((select count(*) from storage.buckets), 5::bigint);
select results_eq(
  $$ select id from storage.buckets where public = false order by id $$,
  $$ values ('avatars'), ('design-assets'), ('event-materials'), ('finance-receipts'), ('venue-photos') $$
);
select policies_are('storage', 'objects', array[
  'owners can read private workspace files',
  'owners can upload private workspace files',
  'owners can update private workspace files',
  'owners can delete private workspace files'
]);
select is_empty($$ select id from storage.buckets where public = true $$);
select isnt_empty($$ select id from storage.buckets where file_size_limit is not null $$);
select isnt_empty($$ select id from storage.buckets where allowed_mime_types is not null $$);
select is_empty($$ select id from storage.buckets where id not in ('avatars','design-assets','venue-photos','event-materials','finance-receipts') $$);
select * from finish();
rollback;
```

- [ ] **Step 2: Verify RED**

Run: `pnpm exec supabase test db supabase/tests/storage_foundation.test.sql`

Expected: FAIL because no project buckets exist.

- [ ] **Step 3: Implement the Storage migration**

Create `supabase/migrations/20260810000200_storage_foundation.sql`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic']),
  ('design-assets', 'design-assets', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
  ('venue-photos', 'venue-photos', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic']),
  ('event-materials', 'event-materials', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
  ('finance-receipts', 'finance-receipts', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners can read private workspace files"
on storage.objects for select to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can upload private workspace files"
on storage.objects for insert to authenticated
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can update private workspace files"
on storage.objects for update to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
)
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can delete private workspace files"
on storage.objects for delete to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);
```

Do not grant authenticated users generic bucket access. Feature migrations append narrower business-role policies.

- [ ] **Step 4: Extend the eval contract**

Import the Storage migration as raw text and add:

```ts
import storageSql from '../../../../supabase/migrations/20260810000200_storage_foundation.sql?raw'

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
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm exec supabase db reset
pnpm exec supabase test db supabase/tests/storage_foundation.test.sql
pnpm --dir apps/web exec vitest run --browser.headless src/lib/supabase-foundation.eval.test.ts
```

Expected: all Storage pgTAP assertions and the eval pass.

- [ ] **Step 6: Commit private Storage**

```bash
git add supabase/migrations/20260810000200_storage_foundation.sql supabase/tests/storage_foundation.test.sql apps/web/src/lib/supabase-foundation.eval.test.ts
git commit -m "feat(supabase): add private storage foundation"
```

---

### Task 4: Add a Lazy Supabase Client Without Cutting Over PocketBase

**Files:**
- Create: `apps/web/src/lib/supabase.test.ts`
- Create: `apps/web/src/lib/supabase.ts`
- Create: `apps/web/src/types/database.generated.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getSupabaseClient(): SupabaseClient<Database>`.
- Consumes: `getSupabaseEnvironment()` from Task 1.
- Does not modify: `apps/web/src/lib/pocketbase.ts` or active feature hooks.

- [ ] **Step 1: Generate local database types**

Run:

```bash
pnpm exec supabase db reset
pnpm exec supabase gen types typescript --local > apps/web/src/types/database.generated.ts
```

Add root script:

```json
"supabase:types": "supabase gen types typescript --local > apps/web/src/types/database.generated.ts"
```

- [ ] **Step 2: Write the failing singleton test**

Create `apps/web/src/lib/supabase.test.ts`:

```ts
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
```

- [ ] **Step 3: Verify RED**

Run: `pnpm --dir apps/web exec vitest run --browser.headless src/lib/supabase.test.ts`

Expected: FAIL because `src/lib/supabase.ts` is absent.

- [ ] **Step 4: Implement the lazy singleton**

Create `apps/web/src/lib/supabase.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnvironment } from '@/lib/data-provider'
import type { Database } from '@/types/database.generated'

let client: SupabaseClient<Database> | undefined

export function getSupabaseClient() {
  if (client) return client
  const { url, anonKey } = getSupabaseEnvironment()
  client = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
```

Do not instantiate the client at module import time.

- [ ] **Step 5: Verify GREEN and unchanged PocketBase build**

Run:

```bash
pnpm --dir apps/web exec vitest run --browser.headless src/lib/supabase.test.ts
pnpm typecheck
pnpm build
```

Expected: tests pass and the existing PocketBase-default build succeeds without Supabase env values.

- [ ] **Step 6: Commit the client boundary**

```bash
git add package.json apps/web/src/lib/supabase.ts apps/web/src/lib/supabase.test.ts apps/web/src/types/database.generated.ts
git commit -m "feat(supabase): add lazy typed client"
```

---

### Task 5: Build the Deterministic PocketBase Schema Inventory

**Files:**
- Create: `scripts/supabase/schema-inventory.mjs`
- Create: `scripts/supabase/schema-inventory.test.mjs`
- Create: `scripts/supabase/export-pocketbase-schema.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `normalizeCollections(collections)` returning sorted JSON-safe schema metadata.
- Produces: `/tmp/tk-observer-supabase/pocketbase-schema.json`.
- Consumes: a caller-provided non-production PocketBase Admin API URL and superuser token.
- Refuses: port `8090`, non-loopback hosts, missing `PB_TEST_ALLOW_SCHEMA_EXPORT=1`.

- [ ] **Step 1: Write failing mapper and safety tests**

Create `scripts/supabase/schema-inventory.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeCollections,
  validatePocketBaseTestUrl,
} from './schema-inventory.mjs'

test('normalizes collections without mutating source metadata', () => {
  const source = [
    {
      id: 'runtime-id',
      name: 'zeta',
      type: 'base',
      system: false,
      listRule: 'role = "boss"',
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: ['CREATE INDEX z_b', 'CREATE INDEX z_a'],
      fields: [
        { id: 'field-id', name: 'title', type: 'text', required: true, max: 200 },
        { id: 'field-id-2', name: 'active', type: 'bool', required: false },
      ],
    },
    {
      id: 'runtime-id-2',
      name: 'alpha',
      type: 'view',
      system: false,
      fields: [],
      indexes: [],
    },
  ]
  const snapshot = structuredClone(source)
  const result = normalizeCollections(source)

  assert.deepEqual(source, snapshot)
  assert.deepEqual(result.map((item) => item.name), ['alpha', 'zeta'])
  assert.deepEqual(result[1].indexes, ['CREATE INDEX z_a', 'CREATE INDEX z_b'])
  assert.deepEqual(result[1].fields.map((field) => field.name), ['active', 'title'])
  assert.equal('id' in result[1], false)
  assert.equal('id' in result[1].fields[0], false)
})

test('accepts only non-8090 loopback PocketBase test URLs', () => {
  assert.equal(validatePocketBaseTestUrl('http://127.0.0.1:18090').port, '18090')
  assert.throws(() => validatePocketBaseTestUrl('http://127.0.0.1:8090'))
  assert.throws(() => validatePocketBaseTestUrl('https://example.com:18090'))
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test scripts/supabase/schema-inventory.test.mjs`

Expected: FAIL because the inventory modules are absent.

- [ ] **Step 3: Implement deterministic normalization**

Create `scripts/supabase/schema-inventory.mjs`:

```js
const collectionKeys = [
  'name', 'type', 'system', 'listRule', 'viewRule',
  'createRule', 'updateRule', 'deleteRule',
]

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'id' && key !== 'collectionId')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortObject(item)])
  )
}

export function normalizeCollections(collections) {
  return collections
    .map((collection) => ({
      ...Object.fromEntries(
        collectionKeys
          .filter((key) => key in collection)
          .map((key) => [key, collection[key]])
      ),
      indexes: [...(collection.indexes || [])].sort(),
      fields: (collection.fields || [])
        .map(sortObject)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function validatePocketBaseTestUrl(value) {
  const url = new URL(value)
  if (!['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
    throw new Error('PocketBase schema export requires a loopback host')
  }
  if (url.port === '8090') {
    throw new Error('Refusing to inspect the development PocketBase port 8090')
  }
  return url
}
```

- [ ] **Step 4: Implement the guarded exporter**

Create `scripts/supabase/export-pocketbase-schema.mjs`:

```js
import { mkdir, writeFile } from 'node:fs/promises'
import { normalizeCollections, validatePocketBaseTestUrl } from './schema-inventory.mjs'

const baseUrl = process.env.PB_TEST_BASE_URL
const token = process.env.PB_TEST_SUPERUSER_TOKEN

if (!baseUrl) throw new Error('PB_TEST_BASE_URL is required')
if (!token) throw new Error('PB_TEST_SUPERUSER_TOKEN is required')
if (process.env.PB_TEST_ALLOW_SCHEMA_EXPORT !== '1') {
  throw new Error('PB_TEST_ALLOW_SCHEMA_EXPORT=1 is required')
}

const url = validatePocketBaseTestUrl(baseUrl)
const endpoint = new URL('/api/collections?perPage=500', url)
const response = await fetch(endpoint, {
  headers: { Authorization: token },
})
if (!response.ok) {
  throw new Error(`PocketBase schema request failed: ${response.status}`)
}

const payload = await response.json()
const collections = normalizeCollections(payload.items || [])
const outputDir = '/tmp/tk-observer-supabase'
const outputPath = `${outputDir}/pocketbase-schema.json`
await mkdir(outputDir, { recursive: true })
await writeFile(outputPath, `${JSON.stringify(collections, null, 2)}\n`)

const fieldCount = collections.reduce((sum, item) => sum + item.fields.length, 0)
console.log(`PocketBase schema: ${collections.length} collections, ${fieldCount} fields`)
console.log(outputPath)
```

Add root scripts:

```json
"supabase:schema:test": "node --test scripts/supabase/schema-inventory.test.mjs",
"supabase:schema:export": "node scripts/supabase/export-pocketbase-schema.mjs"
```

Add `.supabase/` and `supabase/.temp/` to `.gitignore`; do not ignore migrations or tests.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test scripts/supabase/schema-inventory.test.mjs
git diff --check
```

Expected: tests pass, unsafe URL cases are rejected, and diff check exits 0.

- [ ] **Step 6: Commit the inventory tool**

```bash
git add package.json .gitignore scripts/supabase
git commit -m "test(supabase): inventory PocketBase schema"
```

---

### Task 6: Document and Verify the Foundation

**Files:**
- Create: `docs/supabase/local-development.md`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces: one command list for local Supabase start, reset, test, type generation, and stop.
- Produces: a documented boundary between anon key, access token, and service role key.

- [ ] **Step 1: Add root verification scripts**

Add:

```json
"supabase:start": "supabase start",
"supabase:reset": "supabase db reset",
"supabase:test": "supabase test db",
"supabase:stop": "supabase stop"
```

- [ ] **Step 2: Write the local development guide**

Document these exact rules:

- Docker must be running before `pnpm supabase:start`.
- Copy `apps/web/.env.example` to the ignored `apps/web/.env` only when testing Supabase.
- The local anon key may be used in the browser; the local service role key is server-only.
- Never paste production secrets into `.env.example`, tests, screenshots, logs, or chat.
- Keep `VITE_DATA_PROVIDER=pocketbase` until the cutover plan explicitly changes it.
- Run `pnpm supabase:reset && pnpm supabase:test && pnpm supabase:types` after every SQL migration.
- Use `pnpm supabase:stop` when local database testing is complete.

Add a short Supabase development link to `README.md`; do not rewrite unrelated README sections.

- [ ] **Step 3: Run the complete foundation gate**

Run:

```bash
pnpm supabase:reset
pnpm supabase:test
pnpm supabase:types
node --test scripts/supabase/schema-inventory.test.mjs
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm test
pnpm --dir apps/web test:eval
pnpm build
git diff --check
```

Expected: every command exits 0, pgTAP passes, existing PocketBase tests remain green, and the default build does not require Supabase variables.

- [ ] **Step 4: Confirm scope before commit**

Run:

```bash
git status --short
git diff --name-only
```

Stage only files named in this plan. Do not stage pre-existing business-blog or Feishu changes.

- [ ] **Step 5: Commit the verified foundation**

```bash
git add README.md package.json docs/supabase/local-development.md
git commit -m "docs(supabase): add local foundation runbook"
```

## Completion Evidence

The foundation is complete only when:

- Local Supabase resets from zero using repository migrations.
- Auth and Storage pgTAP tests pass.
- The frontend Supabase client is lazy and typed.
- The default PocketBase build works without Supabase environment values.
- Public signup remains disabled.
- No public Storage bucket exists.
- The schema inventory refuses the real development PocketBase port.
- Typecheck, lint, format, tests, evals, build, and diff checks all pass.
- Each task is a separate commit and unrelated worktree changes remain unstaged.
