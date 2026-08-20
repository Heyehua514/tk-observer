import assert from 'node:assert/strict'
import test from 'node:test'
import { decryptToken, requireSyncConfig } from './core.mjs'

test('sync boundary fails closed when runtime secrets are incomplete', () => {
  assert.throws(() => requireSyncConfig({ SUPABASE_URL: 'url', SUPABASE_SERVICE_ROLE_KEY: 'key' }), /SYNC_NOT_CONFIGURED/)
  assert.deepEqual(requireSyncConfig({ SUPABASE_URL: 'url', SUPABASE_SERVICE_ROLE_KEY: 'key', FEISHU_TOKEN_ENCRYPTION_KEY: '12345678901234567890123456789012' }).supabaseUrl, 'url')
})

test('sync contract can decrypt OAuth output without exposing it to a response', async () => {
  const { encryptToken } = await import('../feishu-oauth/core.mjs')
  const key = '12345678901234567890123456789012'
  const encrypted = await encryptToken('access-token', key)
  assert.equal(await decryptToken(encrypted, key), 'access-token')
  assert.equal(typeof encrypted, 'string')
})
