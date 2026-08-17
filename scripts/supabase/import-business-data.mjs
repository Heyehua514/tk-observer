/**
 * Supabase 业务数据导入（幂等 upsert，legacy_id 冲突合并）
 * 用途：把 /tmp/tk-observer-supabase/pb-business-export.json（PocketBase 导出）导入本地 Supabase。
 * 所属工作台：全局（数据迁移）
 * 权限：需要本地 Supabase service role key（环境变量 SUPABASE_SERVICE_ROLE_KEY 或 --service-role-key）；
 *       无 key 时默认只做 dry-run 计划输出，不访问网络、不写库。
 */
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPT_DIR, '../..')
const DEFAULT_EXPORT = '/tmp/tk-observer-supabase/pb-business-export.json'
const DEFAULT_URL = 'http://127.0.0.1:54321'

// 导入顺序：父表在前，子表在后。
export const TABLE_ORDER = [
  'creators',
  'clients',
  'companies',
  'competitor_accounts',
  'products',
  'gmv_metrics',
  'weekly_reports',
  'audit_logs',
  'notifications',
  'competitor_style_analysis',
  'design_assets',
  'videos',
]

// 外键翻译：{ 表: { 列: 父表 } }；profiles 不在导出中，按 legacy_id 尝试解析，找不到置空并告警。
export const FK_MAP = {
  videos: { creator_id: 'creators' },
  competitor_style_analysis: { competitor_id: 'competitor_accounts' },
  design_assets: { owner_id: 'profiles', reviewed_by: 'profiles' },
  notifications: { recipient_id: 'profiles' },
}

// 引用 profiles 且 NOT NULL 的外键列：解析不到对应 profile 时整行跳过（避免事务失败）。

// boolean 列白名单：PocketBase 导出以 0/1 整数落盘，Postgres 需要 true/false。
export const BOOLEAN_COLUMNS = {
  creators: ['is_biz_available'],
  venues: ['is_verified'],
  notifications: ['is_read'],
  design_deliverables: ['checklist_ok'],
  blog_articles: ['is_viral'],
  editing_research_records: ['is_viral', 'converted_to_idea'],
}

export const REQUIRED_PROFILE_FKS = { notifications: ['recipient_id'] }

/**
 * 过滤无法解析必需 profile 外键的行（REST 路径与 buildSqlImport 的
 * select-where-exists 行为保持一致：解析不到则整行跳过）。
 * 返回 { rows, skipped }。
 */
export function filterRequiredProfileRows(table, rows, idMap, onWarning) {
  const required = REQUIRED_PROFILE_FKS[table] ?? []
  if (!required.length) return { rows, skipped: 0 }
  const kept = []
  let skipped = 0
  for (const row of rows) {
    const missing = required.filter((column) => {
      const value = row[column]
      return typeof value === 'string' && (!value || !idMap.profiles.has(value))
    })
    if (missing.length) {
      skipped += 1
      onWarning?.(
        `${table} 行 ${row.id} 缺少必需 profile 外键（${missing.join('/')}），已跳过`
      )
    } else {
      kept.push(row)
    }
  }
  return { rows: kept, skipped }
}

/** 收集当前 idMap 里还没有解析的普通外键 legacy_id。 */
export function collectMissingParentRefs(table, rows, idMap) {
  const refs = new Map()
  for (const row of rows) {
    for (const [column, parent] of Object.entries(FK_MAP[table] ?? {})) {
      if (parent === 'profiles') continue
      const value = row[column]
      if (!value || idMap[parent]?.has(value)) continue
      if (!refs.has(parent)) refs.set(parent, new Set())
      refs.get(parent).add(value)
    }
  }
  return refs
}

/** 合并单表 legacy_id → 新 id 映射到共享 idMap（子表 FK 翻译依赖父表映射）。 */
export function mergeTableIds(idMap, table, map) {
  if (map && map.size) idMap[table] = map
  return idMap
}

async function resolveMissingParentRefs({ baseUrl, serviceKey, table, rows, idMap, onWarning }) {
  const refs = collectMissingParentRefs(table, rows, idMap)
  for (const [parent, values] of refs.entries()) {
    const found = await apiFetch(
      baseUrl,
      serviceKey,
      `/rest/v1/${parent}?select=id,legacy_id&legacy_id=in.(${[...values].map((v) => `"${v}"`).join(',')})`
    )
    const map = idMap[parent] ?? new Map()
    for (const row of found) map.set(row.legacy_id, row.id)
    mergeTableIds(idMap, parent, map)
    for (const value of values) {
      if (!map.has(value)) onWarning?.(`${parent} 中未找到 legacy_id=${value}，关联列已置空`)
    }
  }
}

export async function readExport(path = DEFAULT_EXPORT) {
  return JSON.parse(await readFile(path, 'utf8'))
}

export function planImport(data, tables = null) {
  const include = tables
    ? new Set(tables.map((t) => t.trim()).filter(Boolean))
    : null
  return TABLE_ORDER.filter(
    (table) =>
      (!include || include.has(table)) && data.tables?.[table]?.rows?.length
  ).map((table) => {
    const info = data.tables[table]
    const fkColumns = Object.entries(FK_MAP[table] ?? {}).map(([column, parent]) => ({ column, parent }))
    return {
      table,
      rows: info.rows.length,
      columns: info.columns,
      fkColumns,
    }
  })
}

export function coerceValue(table, column, value) {
  if (value === null || value === undefined || value === '') return null
  if (BOOLEAN_COLUMNS[table]?.includes(column)) return Boolean(value)
  return value
}

export function normalizeSecret(value) {
  return String(value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

export function buildRow(table, sourceRow, idMap, columns) {
  const row = { legacy_id: sourceRow.id }
  for (const column of columns ?? []) {
    if (column === 'id') continue
    let value = coerceValue(table, column, sourceRow[column])
    const fk = FK_MAP[table]?.[column]
    if (fk) {
      if (fk === 'profiles') {
        if (value && idMap.profiles?.has(value)) value = idMap.profiles.get(value)
        else value = null
      } else if (value && idMap[fk]?.has(value)) {
        value = idMap[fk].get(value)
      } else {
        value = null
      }
    }
    row[column] = value
  }
  return row
}

function sqlLiteral(value, table, column) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (BOOLEAN_COLUMNS[table]?.includes(column)) return Boolean(value) ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlFkValue(table, column, parent, value) {
  if (!value) return 'null'
  if (parent === 'profiles') {
    return `(select id from public.profiles where legacy_id = ${sqlLiteral(value)})`
  }
  return `(select id from public.${parent} where legacy_id = ${sqlLiteral(value)})`
}

export function buildSqlImport(data) {
  const statements = ['begin;']
  for (const table of TABLE_ORDER) {
    const info = data.tables?.[table]
    if (!info?.rows?.length) continue
    const columns = info.columns.filter((c) => c !== 'id')
    const updateSet = columns
      .map((column) => `"${column}" = excluded."${column}"`)
      .join(', ')
    const quoted = columns.map((c) => `"${c}"`).join(', ')
    const requiredProfileFks = REQUIRED_PROFILE_FKS[table] ?? []
    if (requiredProfileFks.length) {
      // 需要 profile 引用的行按行生成 select-where-exists，解析不到则整行跳过。
      const rowStatements = info.rows.map((row) => {
        const values = columns.map((column) => {
          const raw = row[column]
          const fk = FK_MAP[table]?.[column]
          if (fk) return sqlFkValue(table, column, fk, raw)
          return sqlLiteral(coerceValue(table, column, raw), table, column)
        })
        const where = requiredProfileFks
          .map((column) => `${sqlFkValue(table, column, 'profiles', row[column])} is not null`)
          .join(' and ')
        return (
          `insert into public.${table} (legacy_id, ${quoted}) ` +
          `select '${String(row.id).replace(/'/g, "''")}', ${values.join(', ')} ` +
          `where ${where} on conflict (legacy_id) do update set ${updateSet};`
        )
      })
      statements.push(rowStatements.join('\n'))
    } else {
      const insertValues = info.rows.map((row) => {
        const values = columns.map((column) => {
          const raw = row[column]
          const fk = FK_MAP[table]?.[column]
          if (fk) return sqlFkValue(table, column, fk, raw)
          return sqlLiteral(coerceValue(table, column, raw), table, column)
        })
        return `('${String(row.id).replace(/'/g, "''")}', ${values.join(', ')})`
      })
      statements.push(
        `insert into public.${table} (legacy_id, ${quoted}) values ${insertValues.join(', ')} ` +
          `on conflict (legacy_id) do update set ${updateSet};`
      )
    }
  }
  statements.push('commit;')
  return statements.join('\n')
}

async function apiFetch(baseUrl, serviceKey, path, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${body.slice(0, 400)}`)
  }
  return res.status === 204 ? null : res.json()
}

export async function upsertTable({ baseUrl, serviceKey, table, rows, idMap, onWarning }) {
  // profiles 不在导出中：先按 legacy_id 解析，避免外键列在第一轮置空。
  const profileRefs = new Set()
  for (const row of rows) {
    for (const [column, parent] of Object.entries(FK_MAP[table] ?? {})) {
      if (parent === 'profiles' && typeof row[column] === 'string' && !idMap.profiles.has(row[column])) {
        profileRefs.add(row[column])
      }
    }
  }
  if (profileRefs.size) {
    const found = await apiFetch(
      baseUrl,
      serviceKey,
      `/rest/v1/profiles?select=id,legacy_id&legacy_id=in.(${[...profileRefs].map((v) => `"${v}"`).join(',')})`
    )
    for (const p of found) idMap.profiles.set(p.legacy_id, p.id)
    for (const v of profileRefs) {
      if (!idMap.profiles.has(v)) onWarning?.(`profiles 中未找到 legacy_id=${v}，关联列已置空`)
    }
  }
  await resolveMissingParentRefs({
    baseUrl,
    serviceKey,
    table,
    rows,
    idMap,
    onWarning,
  })
  const { rows: keptRows, skipped } = filterRequiredProfileRows(
    table,
    rows,
    idMap,
    onWarning
  )
  if (!keptRows.length) {
    return { table, rows: 0, skipped, map: new Map() }
  }
  const columns = Object.keys(keptRows[0] ?? {}).filter((c) => c !== 'id')
  const payload = keptRows.map((row) => buildRow(table, row, idMap, columns))
  const returned = await apiFetch(
    baseUrl,
    serviceKey,
    `/rest/v1/${table}?on_conflict=legacy_id`,
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload),
    }
  )
  const map = new Map(returned.map((r) => [r.legacy_id, r.id]))
  return { table, rows: returned.length, skipped, map }
}

export async function runImport({
  exportPath = DEFAULT_EXPORT,
  baseUrl = DEFAULT_URL,
  serviceKey = null,
  dryRun = false,
  tables = null,
  onWarning,
}) {
  const data = await readExport(exportPath)
  const include = tables
    ? new Set(tables.map((t) => t.trim()).filter(Boolean))
    : null
  if (include) {
    for (const table of include) {
      if (!TABLE_ORDER.includes(table)) {
        onWarning?.(`忽略未在导入顺序中的表：${table}`)
      }
    }
  }
  const plan = planImport(data, tables)
  if (!serviceKey || dryRun) {
    return { dryRun: true, plan }
  }
  const idMap = { profiles: new Map() }
  const results = []
  for (const item of plan) {
    const result = await upsertTable({
      baseUrl,
      serviceKey,
      table: item.table,
      rows: data.tables[item.table].rows,
      idMap,
      onWarning,
    })
    mergeTableIds(idMap, item.table, result.map)
    results.push(result)
  }
  return { dryRun: false, results }
}

function printReport(report) {
  if (report.dryRun) {
    console.log('=== 导入计划（dry-run，未写库）===')
    for (const item of report.plan) {
      console.log(`- ${item.table}: ${item.rows} 行`)
      if (item.fkColumns.length) {
        console.log(`  外键: ${item.fkColumns.map((f) => `${f.column} -> ${f.parent}`).join(', ')}`)
      }
    }
    console.log('\n执行真实导入需要 service role key：')
    console.log('  export SUPABASE_SERVICE_ROLE_KEY=$(supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2)')
    console.log('  node scripts/supabase/import-business-data.mjs')
    return
  }
  console.log('=== 导入结果（幂等 upsert，legacy_id 冲突合并）===')
  for (const r of report.results) {
    const skipped = r.skipped ? `（跳过 ${r.skipped} 行）` : ''
    console.log(`- ${r.table}: ${r.rows} 行 upsert 完成${skipped}`)
  }
}

export function parseArgs(argv) {
  const args = {
    serviceKey: normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY) || null,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--sql-only') args.sqlOnly = true
    else if (arg === '--service-role-key') args.serviceKey = normalizeSecret(argv[++i]) || null
    else if (arg === '--export') args.exportPath = argv[++i]
    else if (arg === '--url') args.baseUrl = argv[++i]
    else if (arg === '--tables') args.tables = (argv[++i] ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  }
  return args
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2))
  if (args.sqlOnly) {
    const data = await readExport(args.exportPath ?? DEFAULT_EXPORT)
    console.log(buildSqlImport(data))
    process.exit(0)
  }
  const warnings = []
  const report = await runImport({ ...args, onWarning: (w) => warnings.push(w) })
  if (args.tables) {
    console.log(`（增量导入过滤：${args.tables.join(', ')}）`)
  }
  printReport(report)
  for (const w of warnings) console.log(`[warn] ${w}`)
}
