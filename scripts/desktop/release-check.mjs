#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const required = [
  "TAURI_UPDATER_ENDPOINT",
  "TAURI_UPDATER_PUBLIC_KEY",
  "TAURI_SIGNING_PRIVATE_KEY",
];

export function validateReleaseEnvironment(environment) {
  const missing = required.filter(
    (name) => !String(environment[name] || "").trim(),
  );
  if (missing.length) return { ok: false, missing };
  const invalid = required
    .slice(0, 2)
    .filter((name) => String(environment[name]).includes("${"));
  if (invalid.length) return { ok: false, invalid };
  return { ok: true };
}

export function validateReleaseVersions({
  releaseTag,
  desktopPackageVersion,
  cargoVersion,
  tauriVersion,
}) {
  const expectedVersion = String(desktopPackageVersion || "").trim();
  const expectedTag = expectedVersion ? `v${expectedVersion}` : "";
  const versionSources = [
    ["apps/desktop/src-tauri/Cargo.toml", cargoVersion],
    ["apps/desktop/src-tauri/tauri.conf.json", tauriVersion],
  ];
  const mismatches = [];

  if (releaseTag && releaseTag !== expectedTag) {
    mismatches.push({
      source: "RELEASE_TAG",
      expected: expectedTag,
      actual: releaseTag,
    });
  }

  for (const [source, version] of versionSources) {
    if (version !== expectedVersion) {
      mismatches.push({ source, expected: expectedVersion, actual: version });
    }
  }

  return mismatches.length ? { ok: false, mismatches } : { ok: true };
}

export function readDesktopVersions(repositoryRoot) {
  const desktopPackage = JSON.parse(
    readFileSync(join(repositoryRoot, "apps/desktop/package.json"), "utf8"),
  );
  const cargoManifest = readFileSync(
    join(repositoryRoot, "apps/desktop/src-tauri/Cargo.toml"),
    "utf8",
  );
  const cargoVersion = cargoManifest.match(
    /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m,
  )?.[1];
  const tauriConfig = JSON.parse(
    readFileSync(
      join(repositoryRoot, "apps/desktop/src-tauri/tauri.conf.json"),
      "utf8",
    ),
  );

  return {
    desktopPackageVersion: desktopPackage.version,
    cargoVersion,
    tauriVersion: tauriConfig.version,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const environmentResult = validateReleaseEnvironment(process.env);
  const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const versionResult = validateReleaseVersions({
    releaseTag: process.env.RELEASE_TAG,
    ...readDesktopVersions(repositoryRoot),
  });

  if (!environmentResult.ok || !versionResult.ok) {
    console.error("桌面端发布配置或版本不符合要求。");
    if (environmentResult.missing)
      console.error(`缺少：${environmentResult.missing.join(", ")}`);
    if (environmentResult.invalid)
      console.error(`占位配置：${environmentResult.invalid.join(", ")}`);
    if (versionResult.mismatches) {
      for (const mismatch of versionResult.mismatches) {
        console.error(
          `版本不一致：${mismatch.source} 应为 ${mismatch.expected}，实际为 ${mismatch.actual}`,
        );
      }
    }
    process.exitCode = 1;
  } else {
    console.log("桌面端发布配置和版本检查通过（密钥内容不会输出）。");
  }
}
