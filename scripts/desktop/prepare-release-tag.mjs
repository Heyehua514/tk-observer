#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function getReleaseTagDecision({ releaseTag, headSha, tagSha }) {
  if (!tagSha) return { action: "create" };
  if (tagSha === headSha) return { action: "keep" };

  return {
    action: "reject",
    reason: `标签 ${releaseTag} 指向 ${tagSha}，当前发布提交为 ${headSha}。`,
  };
}

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch (error) {
    if (allowFailure && error.status === 1) return undefined;
    throw error;
  }
}

export function prepareReleaseTag({ releaseTag, headSha }) {
  const tagSha = runGit(
    ["rev-parse", "--verify", "-q", `refs/tags/${releaseTag}^{}`],
    {
      allowFailure: true,
    },
  );
  const decision = getReleaseTagDecision({ releaseTag, headSha, tagSha });

  if (decision.action === "reject") throw new Error(decision.reason);
  if (decision.action === "create") {
    runGit([
      "tag",
      "--annotate",
      releaseTag,
      headSha,
      "-m",
      `TK观察工作台 ${releaseTag}`,
    ]);
    runGit(["push", "origin", `refs/tags/${releaseTag}`]);
  }

  return decision;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const releaseTag = String(process.env.RELEASE_TAG || "").trim();
  if (!releaseTag) throw new Error("RELEASE_TAG 未设置，无法准备发布标签。");

  const decision = prepareReleaseTag({
    releaseTag,
    headSha: runGit(["rev-parse", "HEAD"]),
  });
  console.log(`发布标签 ${releaseTag}：${decision.action}`);
}
