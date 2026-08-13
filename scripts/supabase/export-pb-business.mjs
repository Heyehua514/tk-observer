/**
 * PocketBase → Supabase 业务数据导出（只读，不写源库、不访问网络、不启动服务）
 * 用途：把已映射且存在数据的业务表逐表导出为 JSON + CSV，
 *       列名按对账归一化规则映射到 Supabase 目标列（venue→venue_id 等）。
 * 所属工作台：全局（数据迁移对账）
 * 权限要求：只读本地 data.db，输出只写 /tmp/tk-observer-supabase。
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  columnCandidates,
  listPbTables,
  parseSupabaseTables,
  readPbTable,
} from './reconcile-pb-export.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PB_DB = resolve(SCRIPT_DIR, '../../backend/pb_data/data.db')
const DEFAULT_MIGRATIONS = resolve(SCRIPT_DIR, '../../supabase/migrations')
const DEFAULT_OUTPUT_DIR = '/tmp/tk-observer-supabase'

function targetColumnName(pbName, supabaseColumns) {
  const candidates = columnCandidates(pbName)
  return candidates.find((name) => supabaseColumns.has(name)) ?? pbName
}

function csvCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportBusinessRows({
  pbDbPath = DEFAULT_PB_DB,
  migrationsDir = DEFAULT_MIGRATIONS,
  outputDir = DEFAULT_OUTPUT_DIR,
} = {}) {
  const db = new DatabaseSync(pbDbPath, { readOnly: true })
  try {
    const migrationFiles = []
    for (const file of (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql'))) {
      migrationFiles.push(await readFile(join(migrationsDir, file), 'utf8'))
    }
    const supabaseTables = parseSupabaseTables(migrationFiles.join('\n'))

    const exports = {}
    let exportedRows = 0
    for (const pbName of listPbTables(db)) {
      const supabase = supabaseTables.get(pbName)
      if (!supabase) continue // PB-only 表不导出（users 走 Auth/profiles，其余为空表或系统缓存）
      const table = readPbTable(db, pbName)
      if (table.rows === 0) continue
      const targetColumns = table.columns.map((column) =>
        targetColumnName(column.name, supabase.columns)
      )
      const rows = db
        .prepare(`SELECT * FROM "${pbName}"`)
        .all()
        .map((row) => {
          const out = {}
          for (const column of table.columns) {
            out[targetColumnName(column.name, supabase.columns)] = row[column.name]
          }
          return out
        })
      exports[pbName] = { columns: targetColumns, rows }
      exportedRows += rows.length
    }

    await mkdir(outputDir, { recursive: true })
    const jsonPath = join(outputDir, 'pb-business-export.json')
    await writeFile(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), tables: exports }, null, 2)}\n`)

    const csvPaths = {}
    for (const [tableName, data] of Object.entries(exports)) {
      const header = data.columns.join(',')
      const lines = data.rows.map((row) =>
        data.columns.map((column) => csvCell(row[column])).join(',')
      )
      const csvPath = join(outputDir, `pb-export-${tableName}.csv`)
      await writeFile(csvPath, [header, ...lines, ''].join('\n'))
      csvPaths[tableName] = csvPath
    }

    return {
      jsonPath,
      csvPaths,
      counts: { tables: Object.keys(exports).length, rows: exportedRows },
      tables: exports,
    }
  } finally {
    db.close()
  }
}

export async function main() {
  const result = await exportBusinessRows()
  console.log(`Exported ${result.counts.tables} tables, ${result.counts.rows} rows`)
  console.log(`JSON: ${result.jsonPath}`)
  for (const [tableName, csvPath] of Object.entries(result.csvPaths)) {
    console.log(`CSV ${tableName}: ${csvPath}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
