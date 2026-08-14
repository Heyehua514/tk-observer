/**
 * PocketBase → Supabase Storage 文件本体迁移 + 抽样验证
 * 用途：把 PB 遗留文件（backend/pb_data/storage/**）上传到 Supabase 私有 bucket，
 *       对象路径与数据库 file_path 保持一致；已存在对象跳过（幂等，可反复执行）。
 * 所属工作台：全局（数据迁移收尾）
 * 权限：需要本地 Supabase service role key（SUPABASE_SERVICE_ROLE_KEY，可用
 *       `supabase status -o env` 取），默认 URL http://127.0.0.1:54321；无 key 只做 dry-run 计划。
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPT_DIR, '../..')
const DEFAULT_PB_STORAGE = resolve(ROOT, 'backend/pb_data/storage')
const DEFAULT_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const DEFAULT_REPORT = '/tmp/tk-observer-supabase/file-migration-report.json'

// 表 → 文件列 → Storage bucket。照片数组列用 array=true。
export const FILE_MAP = [
  { table: 'design_assets', column: 'file_path', bucket: 'design-assets', hasDeletedAt: true },
  { table: 'videos', column: 'file_path', bucket: 'video-files', hasDeletedAt: true },
  { table: 'venues', column: 'photo_paths', bucket: 'venue-photos', array: true, hasDeletedAt: true },
  { table: 'event_materials', column: 'file_path', bucket: 'event-materials', hasDeletedAt: true },
  { table: 'event_finances', column: 'receipt_path', bucket: 'finance-receipts', hasDeletedAt: true },
  { table: 'profiles', column: 'avatar_path', bucket: 'avatars' },
]

// 与 storage.buckets.allowed_mime_types 保持一致；bucket 按后缀拒绝的类型在计划阶段标记。
export const BUCKET_ALLOWED_MIMES = {
  'design-assets': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'],
  'video-files': ['video/mp4', 'video/webm', 'video/quicktime'],
  'venue-photos': ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  'event-materials': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'],
  'finance-receipts': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'],
  avatars: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
}

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

/** 按扩展名推断 MIME；未知返回空串（视为无法上传）。 */
export function mimeFromPath(path) {
  const ext = String(path || '').split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_MIME[ext] ?? ''
}

/** 递归扫描 PB 存储目录，返回 文件名(小写) -> 绝对路径。 */
export async function discoverPbFiles(pbStorageDir) {
  const found = new Map()
  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) await walk(abs)
      else if (entry.isFile() && !entry.name.endsWith('.attrs')) {
        found.set(entry.name.toLowerCase(), abs)
      }
    }
  }
  await walk(pbStorageDir)
  return found
}

/** 从 PostgREST 行集提取文件路径列表（数组列拆平，空值过滤）。 */
export function extractFilePaths(row, column, isArray) {
  const value = row?.[column]
  if (isArray) {
    if (!Array.isArray(value)) return []
    return value.map((p) => String(p).trim()).filter(Boolean)
  }
  if (!value) return []
  const text = String(value).trim()
  return text ? [text] : []
}

/** 把行集构造成迁移任务：{ table, bucket, paths, rows }，已软删行跳过。 */
export function buildPlan(rowsByTable, existingByBucket = {}, pbFiles = new Map()) {
  const plan = { upload: [], skip: [], missing: [], rejected: [] }
  for (const spec of FILE_MAP) {
    const rows = rowsByTable[spec.table] ?? []
    const existing = new Set(existingByBucket[spec.bucket] ?? [])
    for (const row of rows) {
      if (row.deleted_at) continue
      for (const path of extractFilePaths(row, spec.column, spec.array)) {
        if (!path) continue
        const item = { table: spec.table, bucket: spec.bucket, path }
        if (existing.has(path)) {
          plan.skip.push({ ...item, reason: 'already_exists' })
        } else if (pbFiles.has(path.toLowerCase())) {
          const source = pbFiles.get(path.toLowerCase())
          const mime = mimeFromPath(path)
          const allowed = BUCKET_ALLOWED_MIMES[spec.bucket] ?? []
          if (!mime || !allowed.includes(mime)) {
            plan.rejected.push({ ...item, reason: 'mime_not_allowed' })
          } else {
            plan.upload.push({ ...item, source, mime })
          }
        } else {
          plan.missing.push({ ...item, reason: 'source_not_found' })
        }
      }
    }
  }
  return plan
}

async function storageApi(baseUrl, serviceKey, path, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.status === 204 ? null : res.json()
}

async function listBucketObjects(baseUrl, serviceKey, bucket) {
  const acc = []
  let offset = 0
  for (;;) {
    const body = await storageApi(baseUrl, serviceKey, '/storage/v1/object/list/' + bucket, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 200, offset }),
    })
    if (!Array.isArray(body) || body.length === 0) return acc
    for (const item of body) if (item?.name) acc.push(String(item.name))
    offset += body.length
  }
}

async function uploadObject(baseUrl, serviceKey, bucket, path, bytes, contentType = 'application/octet-stream') {
  return storageApi(
    baseUrl,
    serviceKey,
    `/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
      body: bytes,
    }
  )
}

async function signAndFetch(baseUrl, serviceKey, bucket, path) {
  const sign = await storageApi(baseUrl, serviceKey, `/storage/v1/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, expiresIn: 3600 }),
  })
  const signed = String(sign.signedURL ?? '')
  const url = signed.startsWith('/object/sign/')
    ? `${baseUrl}/storage/v1${signed}`
    : signed
  const res = await fetch(url)
  return { signStatus: 200, fetchStatus: res.status }
}

/**
 * 抽样验证：核对“活跃行文件路径 ↔ Storage 对象”一致，并对每个有活跃文件的 bucket
 * 抽 1 个对象做签名 URL 读取。返回 { checks }。
 */
export async function verifyFileStore({ baseUrl = DEFAULT_URL, serviceKey = '', rowsByTable } = {}) {
  const checks = []
  if (!rowsByTable) {
    return { checks: [{ name: '数据源', ok: false, note: '缺少 rowsByTable' }], passed: false }
  }
  const existingByBucket = {}
  for (const spec of FILE_MAP) {
    existingByBucket[spec.bucket] = await listBucketObjects(baseUrl, serviceKey, spec.bucket)
  }
  const plan = buildPlan(rowsByTable, existingByBucket, new Map())
  const livePaths = []
  const mimeBlocked = new Set()
  for (const spec of FILE_MAP) {
    for (const row of rowsByTable[spec.table] ?? []) {
      if (row.deleted_at) continue
      for (const path of extractFilePaths(row, spec.column, spec.array)) {
        if (!path) continue
        livePaths.push({ table: spec.table, bucket: spec.bucket, path })
        const mime = mimeFromPath(path)
        const allowed = BUCKET_ALLOWED_MIMES[spec.bucket] ?? []
        if (!mime || !allowed.includes(mime)) mimeBlocked.add(path)
      }
    }
  }
  const missingLive = plan.missing.filter((m) => !mimeBlocked.has(m.path))
  checks.push({
    name: '活跃文件与 Storage 一致',
    ok: missingLive.length === 0 && plan.upload.length === 0,
    note: `活跃路径 ${livePaths.length}，缺对象 ${missingLive.length}，MIME 不符 ${mimeBlocked.size}`,
  })
  const sampled = new Set()
  for (const item of livePaths) {
    if (mimeBlocked.has(item.path)) continue
    if (sampled.has(item.bucket)) continue
    sampled.add(item.bucket)
    try {
      const { fetchStatus } = await signAndFetch(baseUrl, serviceKey, item.bucket, item.path)
      checks.push({
        name: `签名 URL 读取 ${item.bucket}`,
        ok: fetchStatus === 200,
        note: `${item.path} -> HTTP ${fetchStatus}`,
      })
    } catch (err) {
      checks.push({ name: `签名 URL 读取 ${item.bucket}`, ok: false, note: err.message })
    }
  }
  return { checks, passed: checks.every((c) => c.ok) }
}

/**
 * 执行迁移：跳过已存在对象，上传能找到源文件的任务，返回汇总。
 * rowsByTable 缺省时返回 dry-run（无网络）。
 */
export async function runFileMigration({
  baseUrl = DEFAULT_URL,
  serviceKey = '',
  rowsByTable,
  pbStorageDir = DEFAULT_PB_STORAGE,
  dryRun = !serviceKey,
} = {}) {
  const pbFiles = await discoverPbFiles(pbStorageDir)
  if (dryRun || !rowsByTable) {
    const plan = buildPlan(rowsByTable ?? {}, {}, pbFiles)
    return {
      dryRun: true,
      plan: { upload: plan.upload, skip: plan.skip.length, missing: plan.missing.length, rejected: plan.rejected.length },
      uploaded: 0,
      skipped: 0,
      missing: plan.missing.length,
      rejected: plan.rejected.length,
    }
  }
  const existingByBucket = {}
  for (const spec of FILE_MAP) {
    existingByBucket[spec.bucket] = await listBucketObjects(baseUrl, serviceKey, spec.bucket)
  }
  const plan = buildPlan(rowsByTable, existingByBucket, pbFiles)
  let uploaded = 0
  const failures = []
  for (const item of plan.upload) {
    try {
      const bytes = await readFile(item.source)
      await uploadObject(baseUrl, serviceKey, item.bucket, item.path, bytes, item.mime)
      uploaded += 1
    } catch (err) {
      failures.push({ ...item, error: err.message })
    }
  }
  return {
    dryRun: false,
    uploaded,
    skipped: plan.skip.length,
    missing: plan.missing.length,
    rejected: plan.rejected.length,
    failures,
    plan: {
      upload: plan.upload.map((u) => ({ table: u.table, bucket: u.bucket, path: u.path })),
      skip: plan.skip.map((s) => ({ table: s.table, path: s.path, reason: s.reason })),
      missing: plan.missing.map((m) => ({ table: m.table, bucket: m.bucket, path: m.path })),
      rejected: plan.rejected.map((r) => ({ table: r.table, bucket: r.bucket, path: r.path, reason: r.reason })),
    },
  }
}

async function fetchFileRows(baseUrl, serviceKey) {
  const out = {}
  for (const spec of FILE_MAP) {
    const select = `id,${spec.column}${spec.hasDeletedAt ? ',deleted_at' : ''}`
    const body = await storageApi(
      baseUrl,
      serviceKey,
      `/rest/v1/${spec.table}?select=${select}`
    )
    out[spec.table] = Array.isArray(body) ? body : []
  }
  return out
}

// CLI 入口：node scripts/supabase/migrate-files.mjs [--dry-run|--verify]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  const dryRun = process.argv.includes('--dry-run') || !serviceKey
  const verify = process.argv.includes('--verify')
  if (verify && serviceKey) {
    const rowsByTable = await fetchFileRows(DEFAULT_URL, serviceKey)
    const result = await verifyFileStore({ serviceKey, rowsByTable })
    for (const c of result.checks) {
      console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.name} - ${c.note || ''}`.trim())
    }
    console.log(result.passed ? 'FILE_VERIFY_PASSED' : 'FILE_VERIFY_FAILED')
    process.exit(result.passed ? 0 : 1)
  }
  let rowsByTable
  if (!dryRun) {
    rowsByTable = await fetchFileRows(DEFAULT_URL, serviceKey)
  }
  const report = await runFileMigration({ serviceKey, rowsByTable, dryRun })
  if (!dryRun) {
    await mkdir(dirname(DEFAULT_REPORT), { recursive: true })
    await writeFile(DEFAULT_REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2)}\n`)
  }
  console.log(`=== 文件迁移${report.dryRun ? '计划(dry-run)' : '结果'} ===`)
  console.log(`- 待上传 ${report.plan.upload.length}，已存在跳过 ${report.plan.skip}，缺源 ${report.plan.missing}，MIME 不符 ${report.rejected}`)
  if (report.dryRun) {
    for (const item of report.plan.upload) {
      console.log(`  upload ${item.bucket}/${item.path} <- ${item.source}`)
    }
  } else {
    console.log(`- 实际上传 ${report.uploaded}，失败 ${report.failures.length}`)
    for (const f of report.failures) console.log(`  FAIL ${f.bucket}/${f.path}: ${f.error}`)
    console.log(`- 报告已写入 ${DEFAULT_REPORT}`)
  }
  process.exit(report.failures?.length ? 1 : 0)
}
