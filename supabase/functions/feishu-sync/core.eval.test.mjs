import assert from 'node:assert/strict'
import test from 'node:test'
import { decryptToken } from './core.mjs'

test('sync contract can decrypt OAuth output without exposing it to a response', async () => {
  const { encryptToken } = await import('../feishu-oauth/core.mjs')
  const key = '12345678901234567890123456789012'
  const encrypted = await encryptToken('access-token', key)
  assert.equal(await decryptToken(encrypted, key), 'access-token')
  assert.equal(typeof encrypted, 'string')
})
