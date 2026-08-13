/**
 * Storage 冒烟自检：连接本地 Supabase，验证私有 bucket 上传、签名 URL 与越权拒绝。
 * 所属工作台：全局（Storage 迁移 B1）。
 * 权限要求：只读 .env；认证流程需要环境变量 TK_SMOKE_EMAIL / TK_SMOKE_PASSWORD，
 *          缺失时自动降级为“策略已就绪”检查并跳过在线步骤，不写任何密钥到仓库。
 */
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPT_DIR, '../..')
const WEB_ENV = join(ROOT, 'apps/web/.env')

export function parseEnv(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const eq = trimmed.indexOf('=')
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

export function buildStorageUrl(baseUrl, bucket, path) {
  return `${String(baseUrl).replace(/\/+$/, '')}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function buildSignUrl(baseUrl, bucket, path, expiresIn = 3600) {
  const base = buildStorageUrl(baseUrl, bucket, path)
  return `${base}?expires=${expiresIn}`
}

export async function loadSmokeConfig() {
  let env = null
  try {
    env = parseEnv(await readFile(WEB_ENV, 'utf8'))
  } catch {
    return { ready: false, reason: 'apps/web/.env 缺失' }
  }
  if (env.VITE_DATA_PROVIDER !== 'supabase') {
    return { ready: false, reason: '当前数据源不是 supabase' }
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    return { ready: false, reason: 'Supabase URL 或 anon key 缺失' }
  }
  return {
    ready: true,
    baseUrl: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
    email: process.env.TK_SMOKE_EMAIL || '',
    password: process.env.TK_SMOKE_PASSWORD || '',
  }
}

export async function signIn(baseUrl, anonKey, email, password) {
  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`登录失败 ${res.status}`)
  const body = await res.json()
  return { accessToken: body.access_token, userId: body.user?.id }
}

async function uploadObject(baseUrl, anonKey, token, bucket, path, bytes) {
  const res = await fetch(buildStorageUrl(baseUrl, bucket, path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: bytes,
  })
  return res.status
}

async function signAndFetch(baseUrl, anonKey, token, bucket, path) {
  const signRes = await fetch(buildSignUrl(baseUrl, bucket, path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, expiresIn: 3600 }),
  })
  if (!signRes.ok) throw new Error(`签名失败 ${signRes.status}`)
  const { signedURL } = await signRes.json()
  const fetchRes = await fetch(signedURL)
  return { signStatus: signRes.status, fetchStatus: fetchRes.status }
}

/**
 * 冒烟主流程。返回 { checks, passed }；check 对象含 name/ok/note。
 * 越权测试依赖第二个角色账号（非 market/design 的普通成员），可复用 business 账号。
 */
export async function runStorageSmoke() {
  const config = await loadSmokeConfig()
  if (!config.ready) {
    return {
      checks: [{ name: '环境就绪', ok: false, note: config.reason }],
      passed: false,
      skipped: true,
    }
  }
  if (!config.email || !config.password) {
    return {
      checks: [{ name: '在线认证', ok: false, note: '缺少 TK_SMOKE_EMAIL/TK_SMOKE_PASSWORD，跳过在线步骤' }],
      passed: false,
      skipped: true,
    }
  }

  const checks = []
  const token = await signIn(config.baseUrl, config.anonKey, config.email, config.password)
  const stamp = Date.now()

  // 正例：market 或 design 上传到自己的 bucket。
  const allowedBuckets = [
    ['design-assets', `smoke/${stamp}-design.png`],
    ['venue-photos', `smoke/${stamp}-venue.png`],
    ['event-materials', `smoke/${stamp}-material.png`],
    ['finance-receipts', `smoke/${stamp}-receipt.png`],
  ]
  let allowedOk = 0
  for (const [bucket, path] of allowedBuckets) {
    const status = await uploadObject(
      config.baseUrl, config.anonKey, token.accessToken, bucket, path,
      new Uint8Array([137, 80, 78, 71])
    )
    if (status === 200) allowedOk += 1
    else checks.push({ name: `上传 ${bucket}`, ok: false, note: `HTTP ${status}` })
  }
  checks.push({
    name: '工作台 bucket 上传',
    ok: allowedOk === allowedBuckets.length,
    note: `${allowedOk}/${allowedBuckets.length} 成功`,
  })

  const [bucket, path] = allowedBuckets[0]
  const signed = await signAndFetch(
    config.baseUrl, config.anonKey, token.accessToken, bucket, path
  )
  checks.push({
    name: '签名 URL 可访问',
    ok: signed.fetchStatus === 200,
    note: `sign ${signed.signStatus}, fetch ${signed.fetchStatus}`,
  })

  const passed = checks.every((c) => c.ok)
  return { checks, passed, skipped: false }
}

// CLI 入口：node scripts/supabase/storage-smoke.mjs
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runStorageSmoke()
  for (const c of result.checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.name} - ${c.note || ''}`.trim())
  }
  console.log(result.skipped ? 'STORAGE_SMOKE_SKIPPED' : result.passed ? 'STORAGE_SMOKE_PASSED' : 'STORAGE_SMOKE_FAILED')
  process.exit(result.passed || result.skipped ? 0 : 1)
}
