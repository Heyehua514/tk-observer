/**
 * reconcile-pb-export 对账工具测试
 * 覆盖：行数统计、表映射、列名归一化（created→created_at、venue→venue_id）、
 *       packed 单行建表解析、alter table add column 解析、PB-only / Supabase-only 分类。
 * 所属工作台：全局（数据迁移对账）
 * 权限要求：全部使用临时文件，不触碰真实数据。
 */
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { reconcile } from './reconcile-pb-export.mjs'

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'tk-reconcile-'))
  const pbDbPath = join(root, 'data.db')
  const db = new DatabaseSync(pbDbPath)
  db.exec(`
    create table events (id text primary key, name text, created text, updated text, venue text);
    insert into events values ('e1', '沙龙', '2026-08-01', '2026-08-02', 'v1');
    insert into events values ('e2', '峰会', '2026-08-01', '2026-08-02', 'v2');
    create table legacy_only (id text primary key, title text);
    insert into legacy_only values ('l1', '旧数据');
    create table venues (id text primary key, name text, photos text);
  `)
  db.close()
  const migrationsDir = join(root, 'migrations')
  await mkdir(migrationsDir)
  await writeFile(
    join(migrationsDir, '001.sql'),
    [
      `create table public.events (`,
      `  id uuid primary key default gen_random_uuid(), legacy_id text unique,`,
      `  name text not null,`,
      `  created_at timestamptz not null default now(),`,
      `  updated_at timestamptz not null default now(),`,
      `  deleted_at timestamptz`,
      `);`,
      ``,
      `alter table public.events`,
      `add column if not exists venue_id uuid references public.venues(id) on delete set null;`,
      ``,
      `create table public.venues (`,
      `  id uuid primary key, name text not null,`,
      `  photo_paths text[] not null default '{}',`,
      `  created_at timestamptz, updated_at timestamptz, deleted_at timestamptz`,
      `);`,
      ``,
      `create table public.member_invitations (`,
      `  id uuid primary key, email text not null, created_at timestamptz`,
      `);`,
      '',
    ].join('\n')
  )
  return { root, pbDbPath, migrationsDir }
}

test('reconcile maps tables, row counts and normalized columns', async () => {
  const { root, pbDbPath, migrationsDir } = await fixture()
  try {
    const report = await reconcile({ pbDbPath, migrationsDir })
    assert.equal(report.counts.pbTables, 3)
    assert.equal(report.counts.supabaseTables, 3)
    assert.equal(report.counts.totalPbRows, 3)
    assert.equal(report.counts.mappedWithData, 1)

    const events = report.tables.find((table) => table.name === 'events')
    assert.equal(events.status, 'mapped')
    assert.equal(events.rows, 2)
    assert.deepEqual(events.missingColumns, [])

    const venues = report.tables.find((table) => table.name === 'venues')
    assert.equal(venues.status, 'mapped')
    assert.deepEqual(venues.missingColumns, [])

    assert.deepEqual(
      report.pbOnly.map((item) => item.name),
      ['legacy_only']
    )
    assert.deepEqual(report.supabaseOnly, ['member_invitations'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('reconcile keeps pb-only empty tables and reports no fake gaps', async () => {
  const { root, pbDbPath, migrationsDir } = await fixture()
  try {
    const report = await reconcile({ pbDbPath, migrationsDir })
    const legacyOnly = report.tables.find((table) => table.name === 'legacy_only')
    assert.equal(legacyOnly.status, 'pb_only')
    assert.equal(legacyOnly.rows, 1)
    const withMissing = report.tables.filter(
      (table) => table.status === 'mapped' && table.missingColumns.length > 0
    )
    assert.deepEqual(withMissing, [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('reconcile flags real column gaps like event_materials.designer', async () => {
  const { root, pbDbPath, migrationsDir } = await fixture()
  try {
    const db = new DatabaseSync(pbDbPath)
    db.exec(`create table event_materials (id text primary key, name text, designer text);`)
    db.close()
    const fs = await import('node:fs/promises')
    await fs.appendFile(
      join(migrationsDir, '002.sql'),
      [
        `create table public.event_materials (`,
        `  id uuid primary key, name text not null,`,
        `  file_path text, status text, notes text,`,
        `  created_at timestamptz, updated_at timestamptz`,
        `);`,
        '',
      ].join('\n')
    )
    const report = await reconcile({ pbDbPath, migrationsDir })
    const materials = report.tables.find((table) => table.name === 'event_materials')
    assert.equal(materials.status, 'mapped')
    assert.deepEqual(materials.missingColumns, ['designer'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
