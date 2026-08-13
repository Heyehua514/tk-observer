/**
 * deploy-check 工具测试（只读）
 * 用途：验证部署自检的密钥脱敏、环境变量识别与 migration 顺序检查。
 * 所属工作台：全局（部署准备）
 * 权限要求：只读本地文件，不访问网络，不启动服务。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkEnv,
  checkMigrations,
  collectReport,
  parseEnv,
  redactValue,
} from './deploy-check.mjs'

test('redactValue 不泄露完整密钥', () => {
  assert.equal(redactValue('abc'), '***')
  assert.equal(redactValue('long-secret-value-123'), 'lon***23')
  assert.equal(redactValue(''), '')
})

test('parseEnv 忽略注释并支持 VITE_ 变量', () => {
  const env = parseEnv([
    '# 注释',
    'VITE_DATA_PROVIDER=supabase',
    'VITE_SUPABASE_URL=http://127.0.0.1:54321',
    '',
  ].join('\n'))
  assert.equal(env.VITE_DATA_PROVIDER, 'supabase')
  assert.equal(env.VITE_SUPABASE_URL, 'http://127.0.0.1:54321')
  assert.equal(Object.hasOwn(env, '# 注释'), false)
})

test('checkEnv 识别 provider 与高权限密钥泄露', () => {
  const ok = checkEnv({ VITE_DATA_PROVIDER: 'supabase', VITE_SUPABASE_URL: 'u', VITE_SUPABASE_ANON_KEY: 'k' })
  assert.equal(ok.provider, 'supabase')
  assert.equal(ok.supabaseReady, true)
  assert.equal(ok.serviceRoleLeak, false)

  const leak = checkEnv({ VITE_SUPABASE_SERVICE_ROLE_KEY: 'secret' })
  assert.equal(leak.serviceRoleLeak, true)
  assert.deepEqual(leak.leakedKeyNames, ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
})

test('checkEnv 缺 .env 与缺配置时给出未就绪标记', () => {
  const missing = checkEnv(null)
  assert.equal(missing.present, false)
  assert.equal(missing.supabaseReady, false)

  const partial = checkEnv({ VITE_SUPABASE_URL: 'u' })
  assert.equal(partial.supabaseReady, false)
})

test('checkMigrations 识别时间戳重复与乱序', () => {
  const ok = checkMigrations(['20260810000100_a.sql', '20260810000200_b.sql'])
  assert.equal(ok.total, 2)
  assert.deepEqual(ok.duplicates, [])
  assert.equal(ok.outOfOrder, false)

  const dup = checkMigrations(['20260810000100_a.sql', '20260810000100_b.sql'])
  assert.deepEqual(dup.duplicates, ['20260810000100'])

  const bad = checkMigrations(['20260810000200_b.sql', '20260810000100_a.sql'])
  assert.equal(bad.outOfOrder, true)
})

test('collectReport 返回完整报告结构', async () => {
  const report = await collectReport()
  assert.equal(typeof report.envCheck, 'object')
  assert.equal(typeof report.migrationCheck.total, 'number')
  assert.ok(Array.isArray(report.missingDocs))
  assert.ok(report.migrationCheck.total >= 10, 'migration 数量应不少于 10')
})
