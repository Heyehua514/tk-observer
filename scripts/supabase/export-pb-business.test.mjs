/**
 * export-pb-business 导出工具测试
 * 覆盖：只导出映射且有数据的表、跳过 PB-only 表、列名归一化、CSV 转义。
 * 所属工作台：全局（数据迁移对账）
 * 权限要求：全部使用临时文件，不触碰真实数据。
 */
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { exportBusinessRows } from './export-pb-business.mjs'

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'tk-export-'))
  const pbDbPath = join(root, 'data.db')
  const db = new DatabaseSync(pbDbPath)
  db.exec(`
    create table events (id text primary key, name text, created text, updated text, venue text);
    insert into events values ('e1', '沙龙,闭门', '2026-08-01', '2026-08-02', 'v1');
    insert into events values ('e2', '峰会"VIP"', '2026-08-01', '2026-08-02', 'v2');
    create table users (id text primary key, email text, name text);
    insert into users values ('u1', 'a@x.com', '磊哥');
    create table venues (id text primary key, name text, photos text);
  `)
  db.close()
  const migrationsDir = join(root, 'migrations')
  await mkdir(migrationsDir)
  await writeFile(
    join(migrationsDir, '001.sql'),
    [
      `create table public.events (`,
      `  id uuid primary key, legacy_id text unique, name text not null,`,
      `  created_at timestamptz not null default now(),`,
      `  updated_at timestamptz not null default now()`,
      `);`,
      ``,
      `alter table public.events`,
      `add column if not exists venue_id uuid;`,
      ``,
      `create table public.venues (`,
      `  id uuid primary key, name text not null, photo_paths text[]`,
      `);`,
      '',
    ].join('\n')
  )
  return { root, pbDbPath, migrationsDir }
}

test('export normalizes column names and skips pb-only/empty tables', async () => {
  const { root, pbDbPath, migrationsDir } = await fixture()
  try {
    const result = await exportBusinessRows({
      pbDbPath,
      migrationsDir,
      outputDir: join(root, 'out'),
    })
    assert.equal(result.counts.tables, 1)
    assert.equal(result.counts.rows, 2)
    assert.deepEqual(Object.keys(result.tables), ['events'])
    const event = result.tables.events
    assert.deepEqual(event.columns, ['id', 'name', 'created_at', 'updated_at', 'venue_id'])
    assert.equal(event.rows[0].created_at, '2026-08-01')
    assert.equal(event.rows[0].venue_id, 'v1')
    const json = JSON.parse(await readFile(result.jsonPath, 'utf8'))
    assert.equal(json.tables.events.rows.length, 2)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('export CSV escapes commas and quotes and keeps row counts', async () => {
  const { root, pbDbPath, migrationsDir } = await fixture()
  try {
    const result = await exportBusinessRows({
      pbDbPath,
      migrationsDir,
      outputDir: join(root, 'out'),
    })
    const csv = await readFile(result.csvPaths.events, 'utf8')
    const lines = csv.trim().split('\n')
    assert.equal(lines.length, 3) // header + 2 rows
    assert.match(lines[1], /^e1,"沙龙,闭门",/)
    assert.match(lines[2], /^e2,"峰会""VIP""",/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
