import assert from "node:assert/strict";
import test from "node:test";
import { getReleaseTagDecision } from "./prepare-release-tag.mjs";

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
