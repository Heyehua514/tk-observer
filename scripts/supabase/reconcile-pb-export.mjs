/**
 * PocketBase → Supabase 数据对账工具（只读，不写任何源数据）
 * 用途：对比本地 PocketBase data.db 与 supabase/migrations 的建表清单，
 *       输出每张业务表的行数、Supabase 是否已建表、列覆盖情况与导入建议。
 * 所属工作台：全局（数据迁移对账）
 * 权限要求：只读本地文件，不访问网络，不启动服务，不修改任何数据库。
 */
import { DatabaseSync } from 'node:sqlite'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PB_DB = resolve(SCRIPT_DIR, '../../backend/pb_data/data.db')
const DEFAULT_MIGRATIONS = resolve(SCRIPT_DIR, '../../supabase/migrations')

const COLUMN_ALIASES = {
  id: ['legacy_id'],
  created: ['created_at'],
  updated: ['updated_at'],
  client: ['client_id'],
  creator: ['creator_id'],
  competitor: ['competitor_id'],
  venue: ['venue_id'],
  event: ['event_id'],
  phase: ['phase_id'],
  requirement: ['requirement_id'],
  asset: ['asset_id'],
  designer: ['designer_id'],
  assignee: ['assignee_id'],
  recipient: ['recipient_id'],
  requester: ['requester_id'],
  owner: ['owner_id', 'owner_name'],
  created_by: ['created_by'],
  linked_opportunity: ['linked_opportunity_id'],
  file: ['file_path'],
  photos: ['photo_paths'],
  receipt: ['receipt_path'],
}

function columnCandidates(name) {
  const aliases = COLUMN_ALIASES[name] || []
  return [...new Set([name, ...aliases])]
}

function tableName(sql) {
  const match = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_0-9]+)/i.exec(sql)
  return match ? match[1] : null
}

const COLUMN_TYPES = new Set([
  'uuid', 'text', 'timestamptz', 'boolean', 'bigint', 'integer',
  'numeric', 'real', 'jsonb', 'bytea', 'date', 'time', 'serial',
])

function normalizeType(type) {
  return type.replace(/\[\]/, '').replace(/\(.*\)/, '')
}

function splitTopLevelColumns(body) {
  const chunks = []
  let depth = 0
  let current = ''
  for (const char of body) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      chunks.push(current)
      current = ''
      continue
    }
    current += char
  }
  chunks.push(current)
  return chunks
}

function parseSupabaseTables(sqlText) {
  const statements = sqlText.split(/;\s*\n/)
  const tables = new Map()
  for (const statement of statements) {
    const name = tableName(statement)
    if (!name) continue
    const openParen = statement.indexOf('(')
    const closeParen = statement.lastIndexOf(')')
    if (openParen < 0 || closeParen < openParen) continue
    const body = statement.slice(openParen + 1, closeParen)
    const columns = new Set()
    for (const chunk of splitTopLevelColumns(body)) {
      const trimmed = chunk.trim()
      if (!trimmed) continue
      const leading = trimmed.split(/\s+/, 2)
      if (leading.length < 2) continue
      const [column, rawType] = leading
      if (COLUMN_TYPES.has(normalizeType(rawType))) columns.add(column)
    }
    tables.set(name, { columns })
  }
  const alterPattern = /alter\s+table\s+(?:public\.)?([a-z_0-9]+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z_0-9]+)\s+([a-z_0-9]+(?:\[[^]]*\])?|numeric(?:\([^)]*\))?|decimal(?:\([^)]*\))?|text\[\]|bigint\[\])/gi
  let match
  while ((match = alterPattern.exec(sqlText)) !== null) {
    const [, alterTable, column, rawType] = match
    if (!COLUMN_TYPES.has(normalizeType(rawType))) continue
    const target = tables.get(alterTable)
    if (target) target.columns.add(column)
  }
  return tables
}

function listPbTables(db) {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table'
         AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'
         AND name NOT LIKE '\\_%' ESCAPE '\\'
       ORDER BY name`
    )
    .all()
  return rows.map((row) => row.name)
}

function readPbTable(db, name) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM "${name}"`).get().c
  const columns = db.prepare(`PRAGMA table_info("${name}")`).all()
  return {
    name,
    rows: count,
    columns: columns.map((column) => ({
      name: column.name,
      type: column.type,
      notNull: column.notnull === 1,
    })),
  }
}

export async function reconcile({ pbDbPath = DEFAULT_PB_DB, migrationsDir = DEFAULT_MIGRATIONS } = {}) {
  const db = new DatabaseSync(pbDbPath, { readOnly: true })
  try {
    const pbTables = listPbTables(db).map((name) => readPbTable(db, name))
    const migrationFiles = (await readdir(migrationsDir)).filter((file) =>
      file.endsWith('.sql')
    )
    const migrationTexts = []
    for (const file of migrationFiles) {
      migrationTexts.push(await readFile(join(migrationsDir, file), 'utf8'))
    }
    const supabaseTables = parseSupabaseTables(migrationTexts.join('\n'))

    const pbNames = new Set(pbTables.map((table) => table.name))
    const report = {
      generatedAt: new Date().toISOString(),
      pbDbPath,
      migrationsDir,
      counts: {
        pbTables: pbTables.length,
        supabaseTables: supabaseTables.size,
        pbOnly: 0,
        supabaseOnly: 0,
        mappedWithData: 0,
        totalPbRows: 0,
      },
      tables: [],
      pbOnly: [],
      supabaseOnly: [],
    }

    for (const table of pbTables) {
      const supabase = supabaseTables.get(table.name)
      report.counts.totalPbRows += table.rows
      if (!supabase) {
        report.counts.pbOnly += 1
        report.pbOnly.push({ name: table.name, rows: table.rows })
        report.tables.push({
          name: table.name,
          rows: table.rows,
          status: 'pb_only',
          supabaseColumns: null,
        })
        continue
      }
      const missingColumns = table.columns
        .filter((column) => !columnCandidates(column.name).some((name) => supabase.columns.has(name)))
        .map((column) => column.name)
      report.tables.push({
        name: table.name,
        rows: table.rows,
        status: 'mapped',
        supabaseColumns: supabase.columns.size,
        pbColumns: table.columns.length,
        missingColumns: [...missingColumns],
      })
      if (table.rows > 0) {
        report.counts.mappedWithData += 1
      }
    }

    for (const name of supabaseTables.keys()) {
      if (!pbNames.has(name)) {
        report.counts.supabaseOnly += 1
        report.supabaseOnly.push(name)
      }
    }
    return report
  } finally {
    db.close()
  }
}

export async function main() {
  const report = await reconcile()
  const outputDir = '/tmp/tk-observer-supabase'
  await mkdir(outputDir, { recursive: true })
  const jsonPath = join(outputDir, 'reconcile-report.json')
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`PocketBase tables: ${report.counts.pbTables}`)
  console.log(`Supabase tables: ${report.counts.supabaseTables}`)
  console.log(`PB-only tables: ${report.counts.pbOnly}`)
  console.log(`Supabase-only tables: ${report.counts.supabaseOnly}`)
  console.log(`Mapped tables with data: ${report.counts.mappedWithData}`)
  console.log(`Total PB rows (business tables): ${report.counts.totalPbRows}`)
  console.log(`Report: ${jsonPath}`)
  if (report.pbOnly.length > 0) {
    console.log('PB-only:', report.pbOnly.map((item) => `${item.name}(${item.rows})`).join(', '))
  }
  if (report.supabaseOnly.length > 0) {
    console.log('Supabase-only:', report.supabaseOnly.join(', '))
  }
  const missing = report.tables.filter((table) => table.missingColumns?.length > 0)
  if (missing.length > 0) {
    console.log('Column gaps:', missing.map((table) => `${table.name}: ${table.missingColumns.join(',')}`).join(' | '))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
