import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getReleaseTagDecision } from "./prepare-release-tag.mjs";

const workflowPath = new URL(
  "../../.github/workflows/desktop-release.yml",
  import.meta.url,
);
const tauriConfigPath = new URL(
  "../../apps/desktop/src-tauri/tauri.conf.json",
  import.meta.url,
);

test("creates a missing release tag for the checked-out commit", () => {
  assert.deepEqual(
    getReleaseTagDecision({
      releaseTag: "v0.1.1",
      headSha: "102d57f",
      tagSha: undefined,
    }),
    { action: "create" },
  );
});

test("keeps a release tag that already points to the checked-out commit", () => {
  assert.deepEqual(
    getReleaseTagDecision({
      releaseTag: "v0.1.1",
      headSha: "102d57f",
      tagSha: "102d57f",
    }),
    { action: "keep" },
  );
});

test("rejects a release tag that points to a different commit", () => {
  assert.deepEqual(
    getReleaseTagDecision({
      releaseTag: "v0.1.1",
      headSha: "102d57f",
      tagSha: "eacc908",
    }),
    {
      action: "reject",
      reason: "标签 v0.1.1 指向 eacc908，当前发布提交为 102d57f。",
    },
  );
});

test("configures a local Git committer before creating an annotated release tag", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const configStep = workflow.indexOf("Configure release tag committer");
  const prepareStep = workflow.indexOf("Prepare release tag");

  assert.ok(configStep >= 0, "release workflow must configure a Git committer");
  assert.ok(
    configStep < prepareStep,
    "Git committer must be configured before tagging",
  );
  assert.match(workflow, /git config user\.name "github-actions\[bot\]"/);
  assert.match(
    workflow,
    /git config user\.email "41898282\+github-actions\[bot\]@users\.noreply\.github\.com"/,
  );
});

test("serializes release uploads and includes the macOS updater bundle", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf8"));

  assert.match(workflow, /strategy:\n\s+max-parallel: 1/);
  assert.match(workflow, /includeUpdaterJson: true/);
  assert.doesNotMatch(workflow, /uploadUpdaterJson:/);
  assert.match(workflow, /updaterJsonPreferNsis: true/);
  assert.match(workflow, /releaseDraft: false/);
  assert.doesNotMatch(workflow, /releaseDraft: true/);
  assert.match(
    workflow,
    /assetNamePattern: TK_\[version\]_\[platform\]_\[arch\]\[_setup\]\[ext\]/,
  );
  assert.deepEqual(tauriConfig.bundle.targets, ["dmg", "app", "nsis"]);
});

test("passes public Supabase runtime configuration into desktop builds", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /VITE_SUPABASE_URL:\s*\$\{\{ vars\.VITE_SUPABASE_URL \}\}/);
  assert.match(
    workflow,
    /VITE_SUPABASE_ANON_KEY:\s*\$\{\{ vars\.VITE_SUPABASE_ANON_KEY \}\}/,
  );
});
