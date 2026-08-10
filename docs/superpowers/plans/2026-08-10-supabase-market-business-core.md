# Supabase Market Business Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the 10-table Supabase shared core used by the market and business workspaces without cutting the frontend over from PocketBase.

**Architecture:** Three ordered SQL migrations separate shared master data, business transactions, and event collaboration. PostgreSQL constraints and triggers own derived values and column-sensitive collaboration rules; RLS owns row access; pgTAP verifies schema, permissions, workflow behavior, and Realtime publication.

**Tech Stack:** Supabase CLI 2.113, PostgreSQL, pgTAP, Supabase Auth/RLS/Realtime, generated TypeScript database types, pnpm.

## Global Constraints

- Do not modify any published PocketBase migration.
- Keep `VITE_DATA_PROVIDER=pocketbase`; do not add dual writes or frontend hook changes.
- Use UUID primary keys, unique nullable `legacy_id`, `timestamptz`, `bigint` minor-unit money, and `deleted_at` soft deletion.
- Reuse `public.current_user_role()`, `public.has_any_role(text[])`, and `public.set_updated_at()` from `20260810000100_auth_foundation.sql`.
- Do not use external APIs, production credentials, or Supabase Cloud.
- Every production SQL change must first be observed failing in a pgTAP test.

---

### Task 1: Shared creator and client master data

**Files:**
- Create: `supabase/tests/market_business_master_data.test.sql`
- Create: `supabase/migrations/20260810000300_market_business_master_data.sql`

**Interfaces:**
- Consumes: `public.profiles`, `public.has_any_role(text[])`, `public.set_updated_at()`.
- Produces: `public.creators`, `public.clients`, `public.enforce_creator_business_update()`.

- [ ] **Step 1: Write failing pgTAP schema and role tests**

Create a transaction-scoped test with `plan(...)` that asserts both tables exist, `legacy_id` is unique, money/count constraints exist, RLS is enabled, exact policies exist, and role behavior is enforced. Insert active owner, boss, business, market, and editing test identities into `auth.users` plus `profiles`; set the current identity with:

```sql
select set_config(
  'request.jwt.claims',
  json_build_object('sub', business_user_id, 'role', 'authenticated')::text,
  true
);
```

Use `lives_ok` for business reading clients and updating `creators.cooperation_notes`; use `throws_ok` for business changing `creators.nickname`; use `lives_ok` for editing changing `nickname`; use `throws_ok` for editing reading clients. Finish with `rollback`.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:start
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test
```

Expected: `market_business_master_data.test.sql` fails because `public.creators` and `public.clients` do not exist.

- [ ] **Step 3: Implement the shared master-data migration**

Create both tables with the fields and check constraints from the design. Add indexes for creator nickname/region/status and client name/industry/level. Add `set_updated_at` triggers, enable RLS, and add policies:

```sql
create policy "creator collaborators can read active creators" on public.creators
for select to authenticated
using (deleted_at is null and public.has_any_role(array['owner','boss','business','editing']));

create policy "creator owners and editors can manage creators" on public.creators
for all to authenticated
using (public.has_any_role(array['owner','boss','editing']))
with check (public.has_any_role(array['owner','boss','editing']));

create policy "business can update creator business fields" on public.creators
for update to authenticated
using (deleted_at is null and public.has_any_role(array['business']))
with check (deleted_at is null and public.has_any_role(array['business']));
```

Add a `before update` trigger that raises `42501` when role `business` changes any creator column except `is_biz_available`, `cooperation_price`, `cooperation_notes`, and `updated_at`. Add equivalent client policies: owner/boss/business manage, market reads non-deleted rows. Grant table privileges to `authenticated`; only owner may pass the hard-delete policy.

- [ ] **Step 4: Run reset and test GREEN**

Run:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:reset
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test
```

Expected: foundation, storage, and master-data pgTAP files all pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260810000300_market_business_master_data.sql supabase/tests/market_business_master_data.test.sql
git commit -m "feat(supabase): add shared creator client data"
```

### Task 2: Business transaction schema and server rules

**Files:**
- Create: `supabase/tests/business_transactions.test.sql`
- Create: `supabase/migrations/20260810000400_business_transactions.sql`

**Interfaces:**
- Consumes: `public.clients(id)`, `public.creators(id)`, active role helpers.
- Produces: `public.opportunities`, `public.channel_orders`, `public.social_plans`, `public.set_opportunity_probability()`.

- [ ] **Step 1: Write failing business workflow tests**

Assert the three tables, foreign keys, non-negative money constraints, exact RLS policies, and updated-at triggers. Execute one role scenario that creates a client, creates an opportunity at `contact`, updates it through `won`, creates a channel order, and links a social plan. Assert stage probabilities with:

```sql
select is((select probability from public.opportunities where title = '测试商机'), 100, 'won probability is server-derived');
```

Assert `lost` with blank `lost_reason` throws check violation, market cannot read opportunities, and boss can read all non-deleted business records.

- [ ] **Step 2: Run test and verify RED**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test`.

Expected: failure because `public.opportunities` does not exist.

- [ ] **Step 3: Implement business migration**

Create all fields and checks from the design. Use `on delete restrict` for required client/creator references and `on delete set null` for `social_plans.linked_opportunity_id`. Add a `before insert or update of stage` trigger:

```sql
new.probability := case new.stage
  when 'contact' then 10 when 'proposal' then 30 when 'negotiation' then 50
  when 'contract' then 70 when 'won' then 100 when 'lost' then 0
end;
```

Add the check `stage <> 'lost' or nullif(btrim(lost_reason), '') is not null`. Add indexes for pipeline stage/close date, order status/publish date, and social date/status. Enable RLS; owner/boss/business can select, insert, update non-deleted rows, while only owner can hard delete.

- [ ] **Step 4: Run reset and test GREEN**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:reset && PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test`.

Expected: all pgTAP tests pass, including business workflow assertions.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260810000400_business_transactions.sql supabase/tests/business_transactions.test.sql
git commit -m "feat(supabase): add business transaction core"
```

### Task 3: Event collaboration schema, derived progress, and role boundaries

**Files:**
- Create: `supabase/tests/event_collaboration.test.sql`
- Create: `supabase/tests/market_business_workflow.eval.test.sql`
- Create: `supabase/migrations/20260810000500_event_collaboration.sql`

**Interfaces:**
- Consumes: `public.profiles(id)`, `public.clients(id)`, role helpers.
- Produces: five event tables, `public.validate_event_task_phase()`, `public.refresh_event_phase_completion()`, `public.enforce_event_task_collaborator_update()`.

- [ ] **Step 1: Write failing event schema tests**

Assert all five tables, foreign keys, date/percentage constraints, exact policies and triggers. Test that market can create an event and phases, business can read the event and update sponsorships, and unrelated editing cannot read registrations. Test event/phase mismatch rejection and owner visibility of soft-deleted rows.

- [ ] **Step 2: Write failing workflow eval**

Build a complete transaction: market creates an event and two tasks in one phase, assignee completes one task, phase becomes 50, second completion makes it 100, and business moves a sponsorship from `intent` to `signed`. Assert the final event, phase, task, and sponsorship states with `results_eq`.

- [ ] **Step 3: Run tests and verify RED**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test`.

Expected: both new files fail because `public.events` does not exist.

- [ ] **Step 4: Implement event collaboration migration**

Create the five tables and fields from the design. Add indexes for activity list, phase order, task board/due date, registration status, and sponsorship stage. Add a task validation trigger that rejects a phase from another event. Add statement-safe task triggers that recompute affected phases after insert, update, and delete using:

```sql
round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0))::integer
```

Use 0 when no tasks remain. Add a collaborator update trigger that permits assigned business/editing users to change only `status`, `notes`, and `updated_at`. Implement the role matrix from the design; owner alone receives hard-delete policies.

- [ ] **Step 5: Run reset and test GREEN**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:reset && PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test`.

Expected: all schema tests and the cross-role workflow eval pass.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260810000500_event_collaboration.sql supabase/tests/event_collaboration.test.sql supabase/tests/market_business_workflow.eval.test.sql
git commit -m "feat(supabase): add event collaboration core"
```

### Task 4: Realtime contract and generated frontend types

**Files:**
- Create: `supabase/tests/market_business_realtime.test.sql`
- Create: `supabase/migrations/20260810000600_market_business_realtime.sql`
- Modify (generated): `apps/web/src/types/database.generated.ts`
- Modify: `docs/supabase/local-development.md`

**Interfaces:**
- Consumes: all 10 business tables.
- Produces: Realtime publication membership and generated row/insert/update TypeScript types.

- [ ] **Step 1: Write failing Realtime contract test**

Query `pg_publication_tables` and assert exact membership for the 10 table names under publication `supabase_realtime`. Also assert every table has `replica identity full` so update/delete payloads contain old row values.

- [ ] **Step 2: Run test and verify RED**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test`.

Expected: failure because none of the 10 tables is in `supabase_realtime`.

- [ ] **Step 3: Implement Realtime migration**

Set `replica identity full` on each table and add all 10 tables to `supabase_realtime` in one `alter publication` statement. Do not publish auth or invitation tables.

- [ ] **Step 4: Regenerate TypeScript types and document the boundary**

Run:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:reset
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:types
```

Append the exact table scope and the fact that PocketBase remains active to `docs/supabase/local-development.md`.

- [ ] **Step 5: Run all verification gates**

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test
pnpm supabase:schema:test
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm --dir apps/web test
pnpm --dir apps/web test:eval
pnpm build
git diff --check
```

Expected: 0 failures and 0 warnings. Stop local Supabase after evidence is captured:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:stop
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260810000600_market_business_realtime.sql supabase/tests/market_business_realtime.test.sql apps/web/src/types/database.generated.ts docs/supabase/local-development.md
git commit -m "feat(supabase): publish market business core"
```

### Task 5: Delivery evidence and branch completion

**Files:**
- Create: `docs/supabase/market-business-core-verification.md`

**Interfaces:**
- Consumes: fresh command output from Task 4.
- Produces: auditable counts, known limits, restart requirements, and next migration phase.

- [ ] **Step 1: Write the verification report**

Record migration names, pgTAP assertions passed, frontend test/eval counts, typecheck/lint/format/build status, Realtime tables, Docker Analytics limitation, and explicit non-goals. State that no service needs to remain running and that PocketBase is still the default provider.

- [ ] **Step 2: Verify report and repository state**

Run:

```bash
rg -n "T[B]D|T[O]DO|待补|稍后填写" docs/supabase/market-business-core-verification.md
git diff --check
git status --short
```

Expected: placeholder search returns no matches; only the report is uncommitted; diff check passes.

- [ ] **Step 3: Commit**

```bash
git add docs/supabase/market-business-core-verification.md
git commit -m "docs(supabase): record core schema verification"
```
