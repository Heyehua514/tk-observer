import test from 'node:test'
import assert from 'node:assert/strict'
import { validateReleaseEnvironment } from './release-check.mjs'

test('requires updater endpoint, public key, and signing private key', () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: '',
      TAURI_UPDATER_PUBLIC_KEY: 'public',
      TAURI_SIGNING_PRIVATE_KEY: 'private',
    }),
    { ok: false, missing: ['TAURI_UPDATER_ENDPOINT'] }
  )
})

test('rejects placeholder updater configuration', () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: '${TAURI_UPDATER_ENDPOINT}',
      TAURI_UPDATER_PUBLIC_KEY: 'public',
      TAURI_SIGNING_PRIVATE_KEY: 'private',
    }),
    { ok: false, invalid: ['TAURI_UPDATER_ENDPOINT'] }
  )
})

test('accepts complete release configuration without exposing key contents', () => {
  assert.deepEqual(
    validateReleaseEnvironment({
      TAURI_UPDATER_ENDPOINT: 'https://updates.example.com/latest.json',
      TAURI_UPDATER_PUBLIC_KEY: 'public',
      TAURI_SIGNING_PRIVATE_KEY: 'private',
    }),
    { ok: true }
  )
})
