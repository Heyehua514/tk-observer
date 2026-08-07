# WorkBuddy Auto Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unavailable Claude CLI with a non-blocking, validated WorkBuddy CLI batch that writes structured analysis to pending `video_ideas`.

**Architecture:** `auto-analyze.pb.js` schedules a serial five-minute batch and exposes the existing superuser-only manual endpoint. `lib/auto-analyze.js` owns pending-record lookup, prompt construction, safe `$os.cmd` invocation and writes, while a pure CommonJS parser validates direct or CodeBuddy-wrapped JSON output before any record is changed.

**Tech Stack:** PocketBase 0.39 JSVM, WorkBuddy CodeBuddy CLI 2.115.0, CommonJS helpers, Node.js built-in test runner, PocketBase HTTP integration test.

## Global Constraints

- Video creation must never wait for a WorkBuddy call; it only leaves `ai_analysis` empty for the scheduled batch.
- Process at most 50 pending records serially every five minutes.
- Default CLI path is `/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy`; `WORKBUDDY_CLI` may override it.
- Invoke through `$os.cmd(executable, ...args)` with separate arguments; never interpolate a shell command.
- CLI arguments include `-p`, `--output-format json`, `--tools ""`, `--permission-mode dontAsk`, `--max-turns 1`, and `--no-session-persistence`. Do not pass `--json-schema`: CodeBuddy 2.115.0 maps it to an unavailable `StructuredOutput` tool.
- On macOS, invoke CodeBuddy through `/usr/bin/perl -e 'alarm shift; exec @ARGV' 120` with separate arguments so a hung CLI is terminated and the run lock is released.
- Accept only an object containing string arrays `titlePatterns`, `publishTimePatterns`, `contentTypePreferences` and a non-empty string `summary`.
- On missing CLI, authentication failure, credit exhaustion, empty output, malformed JSON or schema mismatch, write neither `ai_analysis` nor `analyzed_at`.
- Use the PocketBase process-wide concurrent store as an atomic run lock; overlapping cron/manual calls return `in_progress` before querying or invoking WorkBuddy.
- Persist the validated batch inside `app.runInTransaction`; a failed save rolls back the whole batch and returns `write_failed`.
- The manual endpoint remains PocketBase-superuser-only; client write restrictions remain unchanged.
- Each production and component file must retain a purpose/workbench/permission header comment.
- Preserve unrelated dirty-worktree changes. Do not edit published migrations.

---

### Task 1: WorkBuddy result parser

**Files:**
- Create: `backend/pb_hooks/lib/workbuddy-analysis.js`
- Create: `backend/tests/workbuddy-analysis.test.cjs`

**Interfaces:**
- Consumes: a CLI stdout string returned by CodeBuddy.
- Produces: `parseWorkBuddyAnalysis(raw): { titlePatterns: string[], publishTimePatterns: string[], contentTypePreferences: string[], summary: string }`; throws on missing or invalid data.

- [ ] **Step 1: Write failing parser tests**

Cover direct JSON, the verified CodeBuddy event array whose final `type=result` event contains fenced JSON, object wrappers whose structured payload is in `result`, `structured_output`, or fenced `content`, and rejection of invalid arrays or blank summaries.

- [ ] **Step 2: Verify the tests fail for the missing module**

Run: `node --test backend/tests/workbuddy-analysis.test.cjs`

Expected: FAIL because `workbuddy-analysis.js` does not exist.

- [ ] **Step 3: Implement strict extraction and normalization**

Parse the outer value once, inspect only the documented wrapper candidates, strip a single Markdown JSON fence when present, validate all four properties, trim strings and discard blank array entries. Return only the four contract fields.

- [ ] **Step 4: Verify parser tests pass**

Run: `node --test backend/tests/workbuddy-analysis.test.cjs`

Expected: all parser tests PASS with no warnings.

### Task 2: Non-blocking WorkBuddy batch hook

**Files:**
- Modify: `backend/pb_hooks/auto-analyze.pb.js`
- Modify: `backend/pb_hooks/lib/auto-analyze.js`
- Create: `backend/tests/auto-analyze.test.cjs`

**Interfaces:**
- Consumes: `parseWorkBuddyAnalysis(raw)` from Task 1 and PocketBase `app`/`os` objects.
- Produces: `run(app, os)` returning `completed`, `empty`, `in_progress`, `workbuddy_unavailable`, or `write_failed` with matching analyzed/pending counts.

- [ ] **Step 1: Write failing orchestration tests**

Use small in-memory app/record/os fakes to prove arguments are passed separately, an absolute default path is used, `WORKBUDDY_CLI` overrides it, valid output writes both fields, and failures save no records.

- [ ] **Step 2: Verify orchestration tests fail against the Claude implementation**

Run: `node --test backend/tests/auto-analyze.test.cjs`

Expected: FAIL because the implementation calls `claude` and has no WorkBuddy schema arguments.

- [ ] **Step 3: Implement the WorkBuddy batch**

Require the parser inside `run`, build a four-field Chinese JSON contract prompt from the pending records, invoke CodeBuddy with the exact constrained arguments, validate before saving any record, store `JSON.stringify(parsed)` and one ISO timestamp, and return explicit statuses.

- [ ] **Step 4: Change the registrar to cron plus manual endpoint**

Remove the record-create AI callback. Add `cronAdd('auto-analyze', '*/5 * * * *', ...)`; require the helper inside both cron and router callbacks to preserve PocketBase JSVM callback isolation.

- [ ] **Step 5: Verify orchestration and parser tests pass**

Run: `node --test backend/tests/workbuddy-analysis.test.cjs backend/tests/auto-analyze.test.cjs`

Expected: all tests PASS.

### Task 3: Integration self-check and operator documentation

**Files:**
- Modify: `backend/tests/team-memory-hooks.integration.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: manual endpoint statuses `completed`, `empty`, and `workbuddy_unavailable`.
- Produces: integration assertions for structured persisted analysis and operator instructions for WorkBuddy availability and override.

- [ ] **Step 1: Update integration assertions**

Assert video creation returns before analysis is populated. For `completed`, validate the four-field persisted JSON and `analyzed_at`; invoke again and expect `empty`. For `workbuddy_unavailable`, assert both fields remain empty.

- [ ] **Step 2: Update README**

Document the five-minute schedule, absolute default CLI path, `WORKBUDDY_CLI` override, required WorkBuddy login, credits usage, output statuses and the fact that creation is non-blocking.

- [ ] **Step 3: Run the temporary PocketBase integration test**

Run the existing `PB_TEST_* node backend/tests/team-memory-hooks.integration.mjs` command against port 8092.

Expected: a WorkBuddy `completed` run followed by `empty`, or a controlled `workbuddy_unavailable` result that leaves the record pending when deliberately testing an invalid CLI path.

### Task 4: Real CLI, failure path and full gates

**Files:**
- Verify only; fix only files already owned by Tasks 1-3 if a defect is found.

**Interfaces:**
- Consumes: finished Tasks 1-3.
- Produces: terminal evidence for success, retry safety, frontend regressions and build integrity.

- [ ] **Step 1: Run a real constrained CodeBuddy request**

Verify a minimal schema-constrained request returns parseable structured JSON. This may consume the user-approved WorkBuddy credits.

- [ ] **Step 2: Verify temporary PocketBase success and retry behavior**

Trigger `auto-analyze`, read the created record, validate persisted JSON and timestamp, trigger again and assert `status=empty`.

- [ ] **Step 3: Verify missing-CLI behavior**

Start a temporary PocketBase with `WORKBUDDY_CLI` pointing to a nonexistent executable, create a pending record, trigger the endpoint and prove both analysis fields remain empty.

- [ ] **Step 4: Run all gates**

Run: `pnpm typecheck`, `pnpm lint`, `pnpm --dir apps/web format:check`, `pnpm --dir apps/web test`, `pnpm --dir apps/web test:eval`, `pnpm build`, `node --test backend/tests/*.test.cjs`, and `git diff --check`.

Expected: zero errors, zero warnings, all tests/evals pass and build exits 0.

- [ ] **Step 5: Review and commit scoped files**

Review for spec compliance, security and failure atomicity. Commit only the plan, parser, hook, tests and README changes; never stage unrelated work. Push only if a Git remote exists.
