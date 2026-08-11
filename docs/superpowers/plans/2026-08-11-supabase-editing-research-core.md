# Supabase Editing Research Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the Supabase schema, RLS, Storage, analytics, derived viral state, and Realtime contract for editing production and creator research without switching the frontend from PocketBase.

**Architecture:** Four ordered SQL migrations separate production media, research records, analytics/viral rules, and Realtime. PostgreSQL triggers own derived fields; RLS and Storage policies enforce role access; pgTAP and scenario evals prove behavior before generated frontend types are updated.

**Tech Stack:** Supabase CLI 2.113, PostgreSQL 17, pgTAP, Supabase Auth/RLS/Storage/Realtime, generated TypeScript database types, pnpm.

## Global Constraints

- Do not modify PocketBase migrations or existing Supabase migrations `20260810000100` through `20260810000600`.
- Keep `VITE_DATA_PROVIDER=pocketbase`; do not add frontend hooks or dual writes.
- Use UUID primary keys, nullable unique `legacy_id`, UTC `timestamptz`, `deleted_at`, and existing role helper functions.
- Do not seed or import PocketBase business records in schema migrations.
- Do not call WorkBuddy, external APIs, Supabase Cloud, Cron, or Edge Functions.
- Every production SQL behavior must first fail in pgTAP or the workflow eval.

---

### Task 1: Editing production tables and private video Storage

**Files:**
- Create: `supabase/tests/editing_production.test.sql`
- Create: `supabase/migrations/20260811000100_editing_production.sql`
- Modify: `supabase/tests/storage_foundation.test.sql`

**Interfaces:**
- Consumes: `public.creators(id)`, `public.has_any_role(text[])`, `public.set_updated_at()`.
- Produces: `public.video_tasks`, `public.videos`, private bucket `video-files`.

- [ ] **Step 1: Write failing schema, RLS, and Storage tests**

Assert both tables, `videos.creator_id` foreign key, nonempty `file_path`, exact policies, updated-at triggers, private bucket MIME/size configuration, and Storage policies. Simulate roles with fixed `auth.users`/`profiles`: editing creates a task and video, business reads videos but not tasks, market reads neither, and business cannot update videos.

- [ ] **Step 2: Verify RED**

Run:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:start
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test
```

Expected: failure because `public.video_tasks`, `public.videos`, and `video-files` do not exist.

- [ ] **Step 3: Implement production schema and Storage**

Create both tables with PocketBase field names, changing only `owner` to `owner_name` and `file` to `file_path` to avoid SQL/function ambiguity. Add partial indexes for status/due date and creator/publish date. Policies:

```sql
owner,boss,editing: select/insert/update non-deleted rows
business: select non-deleted videos only
owner: hard delete
```

Insert `video-files` with 536870912 byte limit and MIME types `video/mp4`, `video/webm`, `video/quicktime`. Add role policies so owner/boss/editing manage objects and business reads them.

The new migration must replace the four existing owner Storage policies with the same names and extend their bucket set to `video-files`, then add `video collaborators can read video files`, `video editors can upload video files`, `video editors can update video files`, and `video editors can delete video files`. Update `storage_foundation.test.sql` to expect these eight final policy names and six private buckets.

- [ ] **Step 4: Verify GREEN and commit**

Run reset plus pgTAP, then commit the migration and test:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:reset
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test
git add supabase/migrations/20260811000100_editing_production.sql supabase/tests/editing_production.test.sql supabase/tests/storage_foundation.test.sql
git commit -m "feat(supabase): add editing production core"
```

### Task 2: Editing research record schema

**Files:**
- Create: `supabase/tests/editing_research_records.test.sql`
- Create: `supabase/migrations/20260811000200_editing_research_records.sql`

**Interfaces:**
- Consumes: profiles and role helpers.
- Produces: `video_ideas`, `import_history`, `competitor_accounts`, `competitor_videos`, `trending_topics`, `competitor_style_analysis`, `enforce_import_history_immutable()`.

- [ ] **Step 1: Write failing record and role tests**

Assert six tables, unique `video_ideas(title,publish_date)`, competitor foreign keys, nonnegative metrics, completion range, updated-at triggers, and exact policies. Verify editing CRUD, business CRUD only on competitor accounts, market no access, and import history rejects changes other than `deleted_at`.

- [ ] **Step 2: Verify RED**

Run `PATH="$HOME/.docker/bin:$PATH" pnpm supabase:test` and confirm failure because `video_ideas` does not exist.

- [ ] **Step 3: Implement research tables and RLS**

Use the final PocketBase fields, including `ai_analysis` and `analyzed_at`. Use `jsonb` for `import_history.snapshot`; use `on delete restrict` for competitor relations. owner/boss/editing manage all research records, while business additionally manages `competitor_accounts`. Only owner gets hard-delete policies.

Add a before-update trigger for import history:

```sql
if row(new.id, new.legacy_id, new.imported_at, new.file_name,
       new.total_rows, new.new_count, new.updated_count, new.snapshot, new.created_at)
   is distinct from
   row(old.id, old.legacy_id, old.imported_at, old.file_name,
       old.total_rows, old.new_count, old.updated_count, old.snapshot, old.created_at)
then raise exception using errcode = '42501', message = 'import history is immutable';
end if;
```

- [ ] **Step 4: Verify GREEN and commit**

Run reset plus pgTAP, then commit:

```bash
git add supabase/migrations/20260811000200_editing_research_records.sql supabase/tests/editing_research_records.test.sql
git commit -m "feat(supabase): add editing research records"
```

### Task 3: Server-derived viral engine

**Files:**
- Create: `supabase/tests/video_viral_engine.eval.test.sql`
- Create: `supabase/migrations/20260811000300_video_viral_engine.sql`

**Interfaces:**
- Consumes: `public.video_ideas`.
- Produces: `recalculate_video_idea_viral(text)`, `handle_video_idea_viral_recalculation()` and column-level write grants.

- [ ] **Step 1: Write failing viral workflow eval**

Test five behaviors: completion rate 60 is viral; 59 is not viral without a views threshold; a high-view peer can become viral at twice the account average; changing/deleting a peer recomputes the account; direct user updates to `is_viral`, `ai_analysis`, or `analyzed_at` throw `42501`.

- [ ] **Step 2: Verify RED**

Run pgTAP and confirm derived flags remain false or can be forged because the functions/triggers do not exist.

- [ ] **Step 3: Implement protected derived state**

Create a security-definer account recalculation function that only reads non-deleted rows and updates `is_viral`. Create an after-row trigger for insert, delete, or changes to account/views/completion/deleted state. Recalculate both old and new accounts when account changes.

Revoke table-level insert/update from authenticated and grant only business input columns, excluding `is_viral`, `ai_analysis`, and `analyzed_at`. Keep select access at table level. Security-definer trigger functions and service role retain controlled access to derived/server fields.

- [ ] **Step 4: Verify GREEN and commit**

Run reset plus pgTAP and commit:

```bash
git add supabase/migrations/20260811000300_video_viral_engine.sql supabase/tests/video_viral_engine.eval.test.sql
git commit -m "feat(supabase): derive video viral state"
```

### Task 4: Analytics views and access behavior

**Files:**
- Create: `supabase/tests/video_idea_analytics.test.sql`
- Create: `supabase/migrations/20260811000400_video_idea_analytics.sql`

**Interfaces:**
- Consumes: `public.video_ideas` and role helpers.
- Produces: four named analytics views matching PocketBase view collection fields.

- [ ] **Step 1: Write failing view tests**

Assert four views and their expected columns. Insert representative videos and verify summary totals, three fixed account rows, eight fixed type rows, top-five feature ranks, soft-delete exclusion, editing visibility, and business receiving no research rows.

- [ ] **Step 2: Verify RED**

Run pgTAP and confirm failure because the views do not exist.

- [ ] **Step 3: Implement security-invoker views**

Build the summary/account/type views with `security_invoker = true`. Build viral features using `regexp_split_to_table`, `regexp_replace`, `row_number()` and the same stop-word list as PocketBase. Every source CTE filters `deleted_at is null` and `has_any_role(array['owner','boss','editing'])`. Grant view select to authenticated.

- [ ] **Step 4: Verify GREEN and commit**

Run reset plus pgTAP and commit:

```bash
git add supabase/migrations/20260811000400_video_idea_analytics.sql supabase/tests/video_idea_analytics.test.sql
git commit -m "feat(supabase): add video idea analytics"
```

### Task 5: Realtime, generated types, documentation, and delivery

**Files:**
- Create: `supabase/tests/editing_realtime.test.sql`
- Create: `supabase/migrations/20260811000500_editing_realtime.sql`
- Modify (generated): `apps/web/src/types/database.generated.ts`
- Modify: `docs/supabase/local-development.md`
- Create: `docs/supabase/editing-research-core-verification.md`

**Interfaces:**
- Consumes: eight business tables and four views.
- Produces: Realtime publication membership, generated types, and auditable delivery evidence.

- [ ] **Step 1: Write failing Realtime test**

Assert all eight tables are in `supabase_realtime`, all use `REPLICA IDENTITY FULL`, and none of the four views is published.

- [ ] **Step 2: Verify RED, implement, and verify GREEN**

Set replica identity and add the eight tables to the existing publication. Run reset and pgTAP until all SQL tests/evals pass.

- [ ] **Step 3: Generate types and document scope**

Run:

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:types
```

Document the eight tables, four views, `video-files` bucket, provider boundary, test counts, limitations, and restart command.

- [ ] **Step 4: Run all gates**

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

Expected: zero failures and warnings. Stop local Supabase after evidence is captured.

- [ ] **Step 5: Commit delivery**

```bash
git add supabase/migrations/20260811000500_editing_realtime.sql supabase/tests/editing_realtime.test.sql apps/web/src/types/database.generated.ts docs/supabase/local-development.md docs/supabase/editing-research-core-verification.md
git commit -m "feat(supabase): complete editing research core"
```
