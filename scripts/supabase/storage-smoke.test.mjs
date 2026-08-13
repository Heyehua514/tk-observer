/**
 * storage-smoke 工具测试：URL 构造、env 解析与无凭据降级路径。
 * 所属工作台：全局。权限要求：只读，不访问网络。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSignUrl,
  buildStorageUrl,
  loadSmokeConfig,
  parseEnv,
  runStorageSmoke,
} from './storage-smoke.mjs'

test('buildStorageUrl 拼接 bucket 与编码后的路径', () => {
  assert.equal(
    buildStorageUrl('http://127.0.0.1:54321', 'venue-photos', 'sh/海景.png'),
    'http://127.0.0.1:54321/storage/v1/object/venue-photos/sh/%E6%B5%B7%E6%99%AF.png'
  )
  assert.equal(
    buildStorageUrl('http://127.0.0.1:54321/', 'avatars', 'a.png'),
    'http://127.0.0.1:54321/storage/v1/object/avatars/a.png'
  )
})

test('buildSignUrl 追加过期参数', () => {
  const url = buildSignUrl('http://127.0.0.1:54321', 'design-assets', 'a.png', 600)
  assert.ok(url.endsWith('/storage/v1/object/design-assets/a.png?expires=600'))
})

test('parseEnv 忽略注释与空行', () => {
  assert.deepEqual(
    parseEnv(['# 注释', '', 'VITE_DATA_PROVIDER=supabase'].join('\n')),
    { VITE_DATA_PROVIDER: 'supabase' }
  )
})

test('无认证凭据时跳过在线步骤且不抛错', async () => {
  const result = await runStorageSmoke()
  assert.equal(result.skipped, true)
  assert.equal(result.passed, false)
  assert.ok(Array.isArray(result.checks))
  assert.match(result.checks[0].note, /TK_SMOKE_EMAIL|缺失/)
})

test('loadSmokeConfig 读取现有 .env 并识别 provider', async () => {
  const config = await loadSmokeConfig()
  assert.equal(typeof config.ready, 'boolean')
  if (config.ready) {
    assert.ok(config.baseUrl.startsWith('http'))
    assert.ok(config.anonKey.length > 20)
  }
})
