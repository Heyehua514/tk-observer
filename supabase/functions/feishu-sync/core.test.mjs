import assert from 'node:assert/strict'
import test from 'node:test'
import { decryptToken, deduplicateByUrl, nextFailureCount, retry, syncSource } from './core.mjs'

test('keeps the newest item for duplicate document URLs', () => {
  assert.deepEqual(
    deduplicateByUrl([
      { source_url: 'doc-1', feishu_updated_at: '2026-08-20T00:00:00Z', source_title: 'old' },
      { source_url: 'doc-1', feishu_updated_at: '2026-08-20T01:00:00Z', source_title: 'new' },
      { source_url: '', source_title: 'ignored' },
    ]),
    [{ source_url: 'doc-1', feishu_updated_at: '2026-08-20T01:00:00Z', source_title: 'new' }]
  )
})

test('retries a transient page failure and then continues', async () => {
  let attempts = 0
  const result = await retry(async () => {
    attempts += 1
    if (attempts < 3) throw new Error('temporary')
    return 'ok'
  })
  assert.equal(result, 'ok')
  assert.equal(attempts, 3)
})

test('syncs pages, writes unique rows, and commits cursors after upsert', async () => {
  const written = []
  const cursors = []
  const result = await syncSource({
    fetchPage: async (cursor) => cursor
      ? { items: [{ source_url: 'doc-2', feishu_updated_at: '2026-08-20T02:00:00Z' }], nextCursor: '' }
      : { items: [{ source_url: 'doc-1', feishu_updated_at: '2026-08-20T00:00:00Z' }], nextCursor: 'next' },
    upsert: async (items) => written.push(...items),
    saveCursor: async (cursor) => cursors.push(cursor),
    sleep: async () => {},
  })
  assert.equal(result.pages, 2)
  assert.equal(result.synced, 2)
  assert.deepEqual(cursors, ['next', ''])
  assert.deepEqual(written.map((item) => item.source_url), ['doc-1', 'doc-2'])
})

test('stops after the bounded page limit', async () => {
  await assert.rejects(
    syncSource({
      maxPages: 1,
      fetchPage: async () => ({ items: [], nextCursor: 'again' }),
      upsert: async () => {},
      saveCursor: async () => {},
      sleep: async () => {},
    }),
    /FEISHU_PAGE_LIMIT/
  )
})

test('does not commit a cursor when document persistence fails', async () => {
  const cursors = []
  await assert.rejects(
    syncSource({
      fetchPage: async () => ({ items: [{ source_url: 'doc' }], nextCursor: '' }),
      upsert: async () => { throw new Error('write failed') },
      saveCursor: async (cursor) => cursors.push(cursor),
      sleep: async () => {},
    }),
    /write failed/
  )
  assert.deepEqual(cursors, [])
})

test('disables a connection on the fifth consecutive failure', () => {
  assert.deepEqual(nextFailureCount(4), { consecutiveFailures: 5, disabled: true })
  assert.deepEqual(nextFailureCount(2), { consecutiveFailures: 3, disabled: false })
})

test('decrypts token material produced by the OAuth contract', async () => {
  const { encryptToken } = await import('../feishu-oauth/core.mjs')
  const key = '12345678901234567890123456789012'
  const encrypted = await encryptToken('refresh-token', key)
  assert.equal(await decryptToken(encrypted, key), 'refresh-token')
})
