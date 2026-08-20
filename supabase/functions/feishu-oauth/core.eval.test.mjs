import assert from 'node:assert/strict'
import test from 'node:test'
import { redactConnection, validateOAuthRequest } from './core.mjs'

test('oauth boundary never exposes token material in the response contract', () => {
  const response = redactConnection({
    connected_at: '2026-08-20T00:00:00.000Z',
    sync_enabled: true,
    last_synced_at: '2026-08-20T01:00:00.000Z',
    consecutive_failures: 0,
    access_token_encrypted: 'do-not-return',
    refresh_token_encrypted: 'do-not-return',
  })
  assert.equal('access_token_encrypted' in response, false)
  assert.equal('refresh_token_encrypted' in response, false)
  assert.equal(response.connected, true)
})

test('oauth boundary accepts only a non-empty bounded code', () => {
  assert.deepEqual(validateOAuthRequest({ code: 'valid-code' }), { code: 'valid-code' })
  assert.throws(() => validateOAuthRequest({ code: '' }), /INVALID_CODE/)
})
