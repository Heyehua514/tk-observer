/**
 * Supabase 上线前本地自检（只读，不执行部署）
 * 用途：在远程部署前检查前端环境变量、迁移文件顺序与关键文档是否就绪，
 *       输出部署前检查清单；任何密钥都不打印。
 * 所属工作台：全局（部署准备）
 * 权限要求：只读本地文件与环境变量文件，不访问网络，不启动服务，不修改任何配置。
 */
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPT_DIR, '../..')
const WEB_ENV = join(ROOT, 'apps/web/.env')
const MIGRATIONS_DIR = join(ROOT, 'supabase/migrations')

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

export function redactValue(value) {
  if (!value) return ''
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 3)}***${value.slice(-2)}`
}

export async function loadWebEnv() {
  try {
    return parseEnv(await readFile(WEB_ENV, 'utf8'))
  } catch {
    return null
  }
}

export async function listMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql'))
  return files.sort()
}

export function checkMigrations(files) {
  const prefixes = files.map((f) => /^(\d{14})/.exec(f)?.[1]).filter(Boolean)
  const duplicates = prefixes.filter((p, i) => prefixes.indexOf(p) !== i)
  const outOfOrder = [...prefixes].some((p, i) => i > 0 && p <= prefixes[i - 1])
  return {
    total: files.length,
    duplicates: [...new Set(duplicates)],
    outOfOrder,
  }
}

export function checkEnv(env) {
  if (!env) {
    return {
      present: false,
      provider: null,
      supabaseReady: false,
      serviceRoleLeak: false,
    }
  }
  const provider = env.VITE_DATA_PROVIDER || 'supabase'
  const supabaseReady = Boolean(
    env.VITE_SUPABASE_URL?.trim() && env.VITE_SUPABASE_ANON_KEY?.trim(),
  )
  const leakedKeys = Object.keys(env).filter((k) =>
    /SERVICE_ROLE|SERVICE_KEY|SECRET|PASSWORD|PRIVATE_KEY/i.test(k),
  )
  return {
    present: true,
    provider,
    supabaseReady,
    serviceRoleLeak: leakedKeys.length > 0,
    leakedKeyNames: leakedKeys,
  }
}

export async function collectReport() {
  const env = await loadWebEnv()
  const migrations = await listMigrations()
  const migrationCheck = checkMigrations(migrations)
  const envCheck = checkEnv(env)
  const requiredDocs = [
    'docs/部署与多端说明.md',
    'docs/验收清单.md',
    'docs/2026-08-13-automation-parity.md',
  ]
  const missingDocs = []
  for (const rel of requiredDocs) {
    try {
      await readFile(join(ROOT, rel), 'utf8')
    } catch {
      missingDocs.push(rel)
    }
  }
  return { envCheck, migrationCheck, missingDocs }
}

function printReport(report) {
  const { envCheck, migrationCheck, missingDocs } = report
  const hardFails = []
  const warns = []

  if (!envCheck.present) {
    warns.push('apps/web/.env 不存在：本地联调可运行，远程部署前必须配置 Supabase 环境变量。')
  } else {
    const mode = envCheck.provider === 'supabase' ? 'Supabase-first' : `显式回退（${envCheck.provider}）`
    console.log(`- 数据提供者：${mode}`)
    if (envCheck.supabaseReady) {
      console.log('- Supabase URL 与 anon key：已配置（值不打印）')
    } else {
      warns.push('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 未配置完整。')
    }
    if (envCheck.serviceRoleLeak) {
      hardFails.push(`.env 中出现疑似高权限密钥名：${envCheck.leakedKeyNames.join('、')}，禁止进入 VITE_* 或仓库。`)
    }
  }

  console.log(`- migration 文件数：${migrationCheck.total}`)
  if (migrationCheck.duplicates.length) {
    hardFails.push(`migration 时间戳重复：${migrationCheck.duplicates.join('、')}`)
  }
  if (migrationCheck.outOfOrder) {
    hardFails.push('migration 时间戳未按升序排列。')
  }

  if (missingDocs.length) {
    warns.push(`关键文档缺失：${missingDocs.join('、')}`)
  } else {
    console.log('- 部署/验收/自动化对齐文档：齐全')
  }

  console.log('\n部署前建议顺序：')
  console.log('1. supabase login && supabase link --project-ref <ref>')
  console.log('2. supabase db push（应用全部 migration）')
  console.log('3. supabase gen types typescript（同步类型）')
  console.log('4. Web 静态托管构建 pnpm --dir apps/web build')
  console.log('5. 关闭公开注册、创建远程维护账号、迁移 Storage 文件')
  console.log('6. 真实业务数据导入与五角色验收（docs/验收清单.md）')

  return { hardFails, warns }
}

export async function main() {
  const report = await collectReport()
  const result = printReport(report)
  if (result.hardFails.length) {
    console.error('\n硬性失败：')
    for (const f of result.hardFails) console.error(`- ${f}`)
    process.exitCode = 1
  }
  if (result.warns.length) {
    console.warn('\n警告：')
    for (const w of result.warns) console.warn(`- ${w}`)
  }
  return report
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  await main()
}
