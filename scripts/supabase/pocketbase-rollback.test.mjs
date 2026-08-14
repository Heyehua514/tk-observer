import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildChecklist,
  checkEnv,
  checkPocketBase,
  checkSupabaseExports,
  evaluateReadiness,
  parseEnv,
} from './pocketbase-rollback.mjs'

test('parseEnv reads provider and URL without leaking values', () => {
  const env = parseEnv(
    '# comment\nVITE_DATA_PROVIDER=supabase\nVITE_POCKETBASE_URL=http://127.0.0.1:8090\n\nVITE_SUPABASE_ANON_KEY=abc123\n'
  )
  assert.equal(env.VITE_DATA_PROVIDER, 'supabase')
  assert.equal(env.VITE_POCKETBASE_URL, 'http://127.0.0.1:8090')
  assert.equal(env.VITE_SUPABASE_ANON_KEY, 'abc123')
})

test('checkEnv reports missing .env and defaults provider to supabase', () => {
  assert.deepEqual(checkEnv(null), { present: false, provider: null, pocketbaseUrl: null })
  assert.equal(checkEnv({}).provider, 'supabase')
  assert.equal(checkEnv({ VITE_DATA_PROVIDER: 'pocketbase' }).provider, 'pocketbase')
})

test('checkPocketBase detects missing database file', async () => {
  const report = await checkPocketBase()
  assert.equal(typeof report.dbPresent, 'boolean')
  assert.equal(typeof report.dbBytes, 'number')
  assert.equal(typeof report.migrationFiles, 'number')
})

test('checkSupabaseExports handles missing export directory', async () => {
  const report = await checkSupabaseExports('/tmp/__tk_rollback_missing__')
  assert.equal(report.present, false)
  assert.deepEqual(report.files, [])
})

test('checkSupabaseExports lists json and csv files when present', async () => {
  const report = await checkSupabaseExports('/tmp/tk-observer-supabase')
  assert.equal(report.present, true)
  assert.ok(report.files.some((f) => f.endsWith('.json')))
  assert.ok(report.files.some((f) => f.endsWith('.csv')))
})

test('buildChecklist emits ordered rollback steps and blocks on missing db', () => {
  const report = {
    env: { provider: 'supabase', pocketbaseUrl: 'http://127.0.0.1:8090' },
    pocketbase: { dbPresent: false, dbBytes: 0, migrationFiles: 15 },
    supabaseExports: { present: false, files: [] },
  }
  const steps = buildChecklist(report)
  assert.equal(steps.length, 7)
  assert.match(steps[0], /provider=supabase/)
  assert.match(steps[1], /阻塞/)
  assert.match(steps[steps.length - 1], /不删除 Supabase/)
})

test('evaluateReadiness passes when db, migrations and exports are ready', () => {
  const verdict = evaluateReadiness({
    pocketbase: { dbPresent: true, dbBytes: 1, migrationFiles: 21 },
    supabaseExports: { present: true, files: ['a.json'] },
  })
  assert.equal(verdict.pass, true)
  assert.deepEqual(verdict.reasons, [])
})

test('evaluateReadiness fails with reasons on any missing readiness', () => {
  const verdict = evaluateReadiness({
    pocketbase: { dbPresent: false, dbBytes: 0, migrationFiles: 10 },
    supabaseExports: { present: false, files: [] },
  })
  assert.equal(verdict.pass, false)
  assert.ok(verdict.reasons.some((r) => r.includes('data.db 缺失')))
  assert.ok(verdict.reasons.some((r) => r.includes('< 15')))
  assert.ok(verdict.reasons.some((r) => r.includes('导出目录')))
})
