# WorkBuddy Gateway Autostart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start a secure local WorkBuddy gateway automatically with the Tauri desktop client so users never launch a command file for normal use.

**Architecture:** A focused Rust module owns the loopback HTTP server, CLI execution, timeout, CORS policy, and restart loop. Tauri `setup` starts that supervisor without changing updater behavior; the React UI only changes its unavailable guidance and acceptance eval.

**Tech Stack:** Rust 2021, Tauri 2, `tiny_http` 0.12, `wait-timeout` 0.2, serde_json, Vitest browser mode.

## Global Constraints

- Never store or print WorkBuddy credentials, prompts, CLI stderr, or local secret values.
- Listen only on `127.0.0.1:8877`.
- Keep AI writes confirmation-gated.
- Do not modify updater workflow files or the root worktree's dirty files.
- Every production behavior starts with a failing gate test and includes a quality eval.

---

### Task 1: Native gateway contract

**Files:**
- Create: `apps/desktop/src-tauri/src/workbuddy_gateway.rs`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/Cargo.lock`

**Interfaces:**
- Produces: `pub fn spawn()` for desktop startup.
- Produces: internal `handle_request`, `extract_assistant_text`, `is_allowed_origin`, and `run_cli` functions covered by unit tests.

- [x] **Step 1: Write failing Rust tests**

```rust
#[test]
fn allows_only_tk_observer_browser_origins() {
    assert!(is_allowed_origin("https://tk-observer.pages.dev"));
    assert!(!is_allowed_origin("https://example.com"));
}

#[test]
fn extracts_last_assistant_output_text() {
    let value = serde_json::json!([
        {"type":"message","role":"assistant","content":[{"type":"output_text","text":"first"}]},
        {"type":"message","role":"assistant","content":[{"type":"output_text","text":"final"}]}
    ]);
    assert_eq!(extract_assistant_text(&value).unwrap(), "final");
}
```

- [x] **Step 2: Run tests and verify RED**

Run: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml workbuddy_gateway`

Expected: compilation fails because `workbuddy_gateway` and its contract do not exist.

- [x] **Step 3: Add minimal gateway implementation**

Implement a `tiny_http` loopback server with `GET /health`, `OPTIONS`, and `POST /analyze`; cap request bodies at 1 MiB; execute only one CodeBuddy process at a time with a 120-second `wait-timeout`; return `429 GATEWAY_BUSY` for concurrent requests and stable JSON error codes for failures.

- [x] **Step 4: Run Rust tests and verify GREEN**

Run: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml workbuddy_gateway`

Expected: all gateway contract tests pass.

### Task 2: Desktop lifecycle and user guidance

**Files:**
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/web/src/features/shared-ai/ai-assistant-panel.tsx`
- Modify: `apps/web/src/features/shared-ai/ai-assistant-panel.test.tsx`
- Modify: `apps/web/src/features/shared-ai/ai-assistant-panel.eval.test.tsx`

**Interfaces:**
- Consumes: `workbuddy_gateway::spawn()`.
- Produces: Tauri startup behavior and user-facing recovery guidance.

- [x] **Step 1: Write failing lifecycle and UI tests**

```rust
#[test]
fn retry_delay_is_bounded_for_port_conflicts() {
    assert_eq!(retry_delay(), Duration::from_secs(2));
}
```

```tsx
it('directs unavailable users to the desktop client', async () => {
  mocks.callWorkBuddyGateway.mockRejectedValue(new Error('GATEWAY_UNAVAILABLE'))
  await screen.getByRole('button', { name: /让 WorkBuddy 执行/ }).click()
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('桌面客户端'))
})
```

- [x] **Step 2: Run focused tests and verify RED**

Run: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml workbuddy_gateway && pnpm --dir apps/web test -- src/features/shared-ai/ai-assistant-panel.test.tsx src/features/shared-ai/ai-assistant-panel.eval.test.tsx`

Expected: lifecycle assertion and desktop-client copy assertion fail.

- [x] **Step 3: Wire startup and replace command-file guidance**

Call `workbuddy_gateway::spawn()` from Tauri `setup`. Replace the unavailable toast with `请打开 TK观察桌面客户端，并确认 WorkBuddy 已登录` while preserving error normalization.

- [x] **Step 4: Run focused tests and verify GREEN**

Run the focused Rust and Vitest commands from Step 2.

Expected: all focused tests pass.

### Task 3: Documentation, acceptance and release gates

**Files:**
- Modify: `scripts/workbuddy-gateway/README.md`
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `docs/验收清单.md`

**Interfaces:**
- Consumes: the final gateway lifecycle and error contract.
- Produces: operator instructions and acceptance evidence.

- [x] **Step 1: Update documentation**

Document desktop-first startup, legacy LaunchAgent fallback, `/health`, allowed origins, no stored credentials, and the authenticated WorkBuddy prerequisite.

- [x] **Step 2: Run complete verification**

```bash
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm --dir apps/web test
pnpm --dir apps/web test:eval
pnpm build
git diff --check
```

Expected: all gateway tests, 353+ frontend tests, 16+ evals, typecheck, lint, build, and diff check pass. Any pre-existing full-repository format failures are reported separately and no unrelated files are reformatted.

- [x] **Step 3: Runtime smoke test**

Build or run the desktop app, verify `curl http://127.0.0.1:8877/health` returns `200`, then verify an unauthorized browser Origin receives `403` without invoking WorkBuddy.

- [x] **Step 4: Commit and push**

Stage only the files listed in this plan, commit with `feat(desktop): auto-start WorkBuddy gateway`, rebase on current `origin/main` if necessary, and push `codex/workbuddy-autostart` without force.
