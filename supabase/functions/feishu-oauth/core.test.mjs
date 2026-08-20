import assert from 'node:assert/strict'
import test from 'node:test'
import { webcrypto } from 'node:crypto'
import {
  buildTokenExchangeRequest,
  encryptToken,
  redactConnection,
  requireOAuthConfig,
  validateOAuthRequest,
} from './core.mjs'

test('rejects missing or oversized authorization codes', () => {
  assert.throws(() => validateOAuthRequest({}), /INVALID_CODE/)
  assert.throws(() => validateOAuthRequest({ code: 'x'.repeat(2049) }), /INVALID_CODE/)
  assert.deepEqual(validateOAuthRequest({ code: ' code-1 ' }), { code: 'code-1' })
})

test('requires app credentials and a 32-byte encryption key', () => {
  assert.throws(() => requireOAuthConfig({}), /FEISHU_NOT_CONFIGURED/)
  assert.deepEqual(requireOAuthConfig({ FEISHU_APP_ID: 'app', FEISHU_APP_SECRET: 'secret', FEISHU_TOKEN_ENCRYPTION_KEY: '12345678901234567890123456789012' }), {
    appId: 'app',
    appSecret: 'secret',
    encryptionKey: '12345678901234567890123456789012',
  })
})

test('builds a server-side token exchange request', () => {
  assert.deepEqual(buildTokenExchangeRequest('app-token', 'auth-code'), {
    url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
    headers: {
      Authorization: 'Bearer app-token',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: { grant_type: 'authorization_code', code: 'auth-code' },
  })
})

test('encrypts token material and never returns the plaintext', async () => {
  const encrypted = await encryptToken('access-token', '12345678901234567890123456789012', webcrypto)
  assert.notEqual(encrypted, 'access-token')
  assert.match(encrypted, /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/)
})

test('redacts token fields from the browser response', () => {
  assert.deepEqual(redactConnection({ connected_at: 'now', sync_enabled: true, last_synced_at: null, consecutive_failures: 0, access_token_encrypted: 'secret' }), {
    connected: true,
    connected_at: 'now',
    sync_enabled: true,
    last_synced_at: null,
    consecutive_failures: 0,
  })
})
