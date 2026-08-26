import test from "node:test";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import {
  readDesktopVersions,
  validateReleaseEnvironment,
  validateReleaseVersions,
} from "./release-check.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

test("requires updater endpoint, public key, and signing private key", () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: "",
      TAURI_UPDATER_PUBLIC_KEY: "public",
      TAURI_SIGNING_PRIVATE_KEY: "private",
    }),
    { ok: false, missing: ["TAURI_UPDATER_ENDPOINT"] },
  );
});

test("rejects placeholder updater configuration", () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: "${TAURI_UPDATER_ENDPOINT}",
      TAURI_UPDATER_PUBLIC_KEY: "public",
      TAURI_SIGNING_PRIVATE_KEY: "private",
    }),
    { ok: false, invalid: ["TAURI_UPDATER_ENDPOINT"] },
  );
});

test("accepts complete release configuration without exposing key contents", () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: "https://updates.example.com/latest.json",
      TAURI_UPDATER_PUBLIC_KEY: "public",
      TAURI_SIGNING_PRIVATE_KEY: "private",
    }),
    { ok: true },
  );
});

test("accepts a release tag that matches every desktop version source", () => {
  assert.deepEqual(
    validateReleaseVersions({
      releaseTag: "v0.1.1",
      desktopPackageVersion: "0.1.1",
      cargoVersion: "0.1.1",
      tauriVersion: "0.1.1",
    }),
    { ok: true },
  );
});

test("rejects a release tag or desktop version source that differs from package version", () => {
  assert.deepEqual(
    validateReleaseVersions({
      releaseTag: "v0.1.2",
      desktopPackageVersion: "0.1.1",
      cargoVersion: "0.1.0",
      tauriVersion: "0.1.1",
    }),
    {
      ok: false,
      mismatches: [
        { source: "RELEASE_TAG", expected: "v0.1.1", actual: "v0.1.2" },
        {
          source: "apps/desktop/src-tauri/Cargo.toml",
          expected: "0.1.1",
          actual: "0.1.0",
        },
      ],
    },
  );
});

test("keeps every desktop release source at version 0.1.6", () => {
  assert.deepEqual(readDesktopVersions(repositoryRoot), {
    desktopPackageVersion: "0.1.6",
    cargoVersion: "0.1.6",
    tauriVersion: "0.1.6",
  });
});
