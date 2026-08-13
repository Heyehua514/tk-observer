import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSqlImport,
  buildRow,
  coerceValue,
  FK_MAP,
  parseArgs,
  planImport,
  TABLE_ORDER,
} from './import-business-data.mjs'

const sampleData = {
  tables: {
    creators: {
      columns: ['id', 'nickname', 'region', 'created_at'],
      rows: [
        { id: 'pb-creator-1', nickname: '达人A', region: 'US', created_at: '2026-08-05 09:22:33.955Z' },
      ],
    },
    videos: {
      columns: ['id', 'title', 'creator_id', 'publish_at'],
      rows: [
        { id: 'pb-video-1', title: '测试视频', creator_id: 'pb-creator-1', publish_at: '' },
      ],
    },
  },
}

test('TABLE_ORDER puts parent tables before children', () => {
  assert.ok(TABLE_ORDER.indexOf('creators') < TABLE_ORDER.indexOf('videos'))
  assert.ok(TABLE_ORDER.indexOf('competitor_accounts') < TABLE_ORDER.indexOf('competitor_style_analysis'))
})

test('planImport keeps ordered tables with rows and fk columns', () => {
  const plan = planImport(sampleData)
  assert.deepEqual(plan.map((p) => p.table), ['creators', 'videos'])
  assert.equal(plan[0].rows, 1)
  assert.deepEqual(plan[1].fkColumns, [{ column: 'creator_id', parent: 'creators' }])
})

test('coerceValue normalizes empty strings and notification booleans', () => {
  assert.equal(coerceValue('videos', 'publish_at', ''), null)
  assert.equal(coerceValue('notifications', 'is_read', 1), true)
  assert.equal(coerceValue('notifications', 'is_read', 0), false)
  assert.equal(coerceValue('creators', 'nickname', '达人A'), '达人A')
  assert.equal(coerceValue('creators', 'is_biz_available', 1), true)
  assert.equal(coerceValue('creators', 'is_biz_available', 0), false)
})

test('buildRow maps id to legacy_id, drops id, translates fks', () => {
  const idMap = {
    creators: new Map([['pb-creator-1', '11111111-1111-1111-1111-111111111111']]),
    profiles: new Map(),
  }
  const row = buildRow('videos', sampleData.tables.videos.rows[0], idMap, sampleData.tables.videos.columns)
  assert.equal(row.legacy_id, 'pb-video-1')
  assert.equal('id' in row, false)
  assert.equal(row.creator_id, '11111111-1111-1111-1111-111111111111')
  assert.equal(row.publish_at, null)
})

test('buildRow nulls unknown profile references', () => {
  const idMap = { profiles: new Map(), creators: new Map() }
  const row = buildRow('design_assets', { id: 'x', owner_id: 'missing-user' }, idMap, ['id', 'owner_id'])
  assert.equal(row.owner_id, null)
})

test('parseArgs reads env key and flags without positional requirement', () => {
  const args = parseArgs(['--dry-run'])
  assert.equal(args.dryRun, true)
  const args2 = parseArgs(['--service-role-key', 'k', '--url', 'http://x'])
  assert.equal(args2.serviceKey, 'k')
  assert.equal(args2.baseUrl, 'http://x')
  assert.ok(FK_MAP.design_assets.owner_id === 'profiles')
})

test('buildSqlImport emits idempotent upsert with fk translation subqueries', () => {
  const sql = buildSqlImport(sampleData)
  assert.match(sql, /^begin;/)
  assert.match(sql, /insert into public\.creators \(legacy_id, "nickname", "region", "created_at"\) values \('pb-creator-1'/)
  assert.match(sql, /on conflict \(legacy_id\) do update set/)
  assert.match(sql, /\(select id from public\.creators where legacy_id = 'pb-creator-1'\)/)
  assert.match(sql, /commit;$/)
})

test('buildSqlImport renders creators boolean columns as true/false', () => {
  const data = {
    tables: {
      creators: {
        columns: ['id', 'nickname', 'is_biz_available'],
        rows: [{ id: 'c1', nickname: '达人A', is_biz_available: 1 }],
      },
    },
  }
  const sql = buildSqlImport(data)
  assert.match(sql, /true/)
  assert.doesNotMatch(sql, /is_biz_available.*[^t]0[,)]/)
})

test('buildSqlImport normalizes notification booleans and guards required profile fks', () => {
  const data = {
    tables: {
      notifications: {
        columns: ['id', 'is_read', 'title', 'recipient_id'],
        rows: [{ id: 'n1', is_read: 1, title: '示例通知', recipient_id: 'u1' }],
      },
    },
  }
  const sql = buildSqlImport(data)
  assert.match(sql, /select 'n1', true, '示例通知', \(select id from public\.profiles where legacy_id = 'u1'\) where \(select id from public\.profiles where legacy_id = 'u1'\) is not null/)
})
