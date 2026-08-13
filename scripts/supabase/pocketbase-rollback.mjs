/**
 * PocketBase 回退就绪检查（只读 dry-run，不写文件、不启动服务、不访问网络）
 * 用途：当 Supabase 不可用时，检查切回 PocketBase 的前置条件是否齐备，
 *       输出回退操作清单（由人手动执行）。
 * 所属工作台：全局（数据源容灾）
 * 权限要求：只读 .env、backend/pb_data/data.db 元信息与 /tmp 导出目录，任何密钥都不打印。
 */
import { readFile, stat, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPT_DIR, '../..')
const WEB_ENV = join(ROOT, 'apps/web/.env')
const PB_DB = join(ROOT, 'backend/pb_data/data.db')
const PB_MIGRATIONS = join(ROOT, 'backend/pb_migrations')
const EXPORT_DIR = '/tmp/tk-observer-supabase'

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

export function checkEnv(env) {
  if (!env) {
    return { present: false, provider: null, pocketbaseUrl: null }
  }
  return {
    present: true,
    provider: env.VITE_DATA_PROVIDER || 'supabase',
    pocketbaseUrl: env.VITE_POCKETBASE_URL || null,
  }
}

async function statOrNull(path) {
  try {
    return await stat(path)
  } catch {
    return null
  }
}

export async function checkPocketBase() {
  const db = await statOrNull(PB_DB)
  let migrations = null
  try {
    migrations = (await readdir(PB_MIGRATIONS)).filter((f) => f.endsWith('.js'))
  } catch {
    migrations = []
  }
  return {
    dbPresent: Boolean(db),
    dbBytes: db?.size ?? 0,
    migrationFiles: migrations.length,
  }
}

export async function checkSupabaseExports(exportDir = EXPORT_DIR) {
  const dir = await statOrNull(exportDir)
  if (!dir) return { present: false, files: [] }
  const names = (await readdir(EXPORT_DIR)).filter((f) => /\.(json|csv)$/i.test(f)).sort()
  return { present: true, files: names }
}

export async function collectReport() {
  let env = null
  try {
    env = parseEnv(await readFile(WEB_ENV, 'utf8'))
  } catch {
    env = null
  }
  return {
    env: checkEnv(env),
    pocketbase: await checkPocketBase(),
    supabaseExports: await checkSupabaseExports(),
  }
}

export function buildChecklist(report) {
  const steps = []
  const { env, pocketbase, supabaseExports } = report

  steps.push(
    `1. 确认数据源：当前 provider=${env.provider ?? '未读取到 .env'}；回退目标 PocketBase URL=${env.pocketbaseUrl ?? '未配置（默认 http://127.0.0.1:8090）'}`
  )
  if (pocketbase.dbPresent) {
    steps.push(
      `2. PocketBase 数据库就绪：backend/pb_data/data.db（${pocketbase.dbBytes} 字节），migration 文件 ${pocketbase.migrationFiles} 个，可启动。`
    )
  } else {
    steps.push(
      '2. 阻塞：backend/pb_data/data.db 不存在。先恢复 PocketBase 数据（备份文件或重新运行 migration），否则不能切回。'
    )
  }
  if (supabaseExports.present) {
    steps.push(
      `3. Supabase 导出目录 /tmp/tk-observer-supabase 存在：${supabaseExports.files.length} 个文件（${supabaseExports.files.join('、') || '无 json/csv'}）。回退前先比对导出数据与 PocketBase 现有数据，避免覆盖丢失。`
    )
  } else {
    steps.push(
      '3. 提示：/tmp/tk-observer-supabase 不存在，当前无 Supabase 数据导出。若 Supabase 中有新数据，先运行 export-pb-business 对应的导出流程再回退。'
    )
  }
  steps.push('4. 把 apps/web/.env 的 VITE_DATA_PROVIDER 改为 pocketbase（或删除 Supabase 变量）。')
  steps.push('5. 启动 backend PocketBase：backend/pocketbase serve --http=127.0.0.1:8090。')
  steps.push('6. 前端冷启动 pnpm dev，用验收账号登录，逐工作台抽查数据与文件预览。')
  steps.push('7. 验证通过前不删除 Supabase 项目与本地导出目录；验证通过后再决定归档。')
  return steps
}

function printReport(report) {
  const { pocketbase, supabaseExports } = report
  console.log('=== PocketBase 回退就绪检查（dry-run）===')
  console.log(`数据提供者：${report.env.provider ?? '未读取到 .env'}`)
  console.log(`PocketBase URL：${report.env.pocketbaseUrl ?? '未配置'}`)
  console.log(`PocketBase 数据文件：${pocketbase.dbPresent ? `存在（${pocketbase.dbBytes} 字节）` : '不存在（阻塞）'}`)
  console.log(`PocketBase migration 文件数：${pocketbase.migrationFiles}`)
  console.log(`Supabase 导出目录：${supabaseExports.present ? `${supabaseExports.files.length} 个文件` : '不存在'}`)
  console.log('\n=== 回退操作清单（手动执行）===')
  for (const step of buildChecklist(report)) console.log(step)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await collectReport()
  printReport(report)
}
