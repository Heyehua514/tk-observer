/**
 * migrate-files 工具测试：表映射、路径提取、PB 文件发现、计划分类与 dry-run。
 * 所属工作台：全局。权限要求：只读，不访问网络。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  BUCKET_ALLOWED_MIMES,
  FILE_MAP,
  buildPlan,
  discoverPbFiles,
  extractFilePaths,
  mimeFromPath,
  runFileMigration,
  verifyFileStore,
} from './migrate-files.mjs'

test('FILE_MAP 覆盖全部文件承载表与目标 bucket', () => {
  const entries = FILE_MAP.map((f) => `${f.table}.${f.column}->${f.bucket}`)
  assert.deepEqual(entries, [
    'design_assets.file_path->design-assets',
    'videos.file_path->video-files',
    'venues.photo_paths->venue-photos',
    'event_materials.file_path->event-materials',
    'event_finances.receipt_path->finance-receipts',
    'profiles.avatar_path->avatars',
  ])
})

test('extractFilePaths 拆平数组列并过滤空值', () => {
  assert.deepEqual(extractFilePaths({ photo_paths: ['a.png', ' b.png ', ''] }, 'photo_paths', true), ['a.png', 'b.png'])
  assert.deepEqual(extractFilePaths({ photo_paths: null }, 'photo_paths', true), [])
  assert.deepEqual(extractFilePaths({ file_path: 'x.png' }, 'file_path', false), ['x.png'])
  assert.deepEqual(extractFilePaths({ file_path: '  ' }, 'file_path', false), [])
})

test('mimeFromPath 按扩展名推断并拒绝未知类型', () => {
  assert.equal(mimeFromPath('a.PNG'), 'image/png')
  assert.equal(mimeFromPath('a/b/c.mp4'), 'video/mp4')
  assert.equal(mimeFromPath('receipt.pdf'), 'application/pdf')
  assert.equal(mimeFromPath('noext'), '')
  assert.ok(BUCKET_ALLOWED_MIMES['design-assets'].includes('application/pdf'))
  assert.ok(!BUCKET_ALLOWED_MIMES['video-files'].includes('image/png'))
})

test('discoverPbFiles 递归扫描并忽略 .attrs 元数据', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pb-files-'))
  await mkdir(join(dir, 'col', 'rec'), { recursive: true })
  await writeFile(join(dir, 'col', 'rec', 'Favicon_Demo.png'), 'x')
  await writeFile(join(dir, 'col', 'rec', 'Favicon_Demo.png.attrs'), 'meta')
  await writeFile(join(dir, 'col', 'rec', 'vid_demo.png'), 'y')
  const files = await discoverPbFiles(dir)
  assert.deepEqual([...files.keys()].sort(), ['favicon_demo.png', 'vid_demo.png'])
  assert.ok(files.get('favicon_demo.png').endsWith('Favicon_Demo.png'))
})

test('buildPlan 分类：已存在跳过 / 有源上传 / 缺源记录', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pb-plan-'))
  await writeFile(join(dir, 'src.png'), 'x')
  const pbFiles = await discoverPbFiles(dir)
  const rows = {
    design_assets: [
      { id: '1', file_path: 'src.png', deleted_at: null },
      { id: '2', file_path: 'existing.png', deleted_at: null },
      { id: '3', file_path: 'ghost.png', deleted_at: null },
      { id: '4', file_path: 'deleted.png', deleted_at: '2026-01-01' },
    ],
  }
  const plan = buildPlan(rows, { 'design-assets': ['existing.png'] }, pbFiles)
  assert.equal(plan.upload.length, 1)
  assert.equal(plan.upload[0].path, 'src.png')
  assert.equal(plan.skip.length, 1)
  assert.equal(plan.skip[0].reason, 'already_exists')
  assert.equal(plan.missing.length, 1)
  assert.equal(plan.missing[0].path, 'ghost.png')
})

test('buildPlan 拒绝 bucket 不允许的 MIME 类型', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pb-mime-'))
  await writeFile(join(dir, 'clip.png'), 'x')
  const pbFiles = await discoverPbFiles(dir)
  const rows = {
    videos: [{ id: '1', file_path: 'clip.png', deleted_at: null }],
  }
  const plan = buildPlan(rows, {}, pbFiles)
  assert.equal(plan.upload.length, 0)
  assert.equal(plan.rejected.length, 1)
  assert.equal(plan.rejected[0].reason, 'mime_not_allowed')
  assert.equal(plan.rejected[0].bucket, 'video-files')
})

test('runFileMigration dry-run 不访问网络并返回计划汇总', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pb-dry-'))
  await writeFile(join(dir, 'src.mp4'), 'x')
  const rows = {
    videos: [{ id: '1', file_path: 'src.mp4', deleted_at: null }],
  }
  const report = await runFileMigration({ rowsByTable: rows, pbStorageDir: dir, dryRun: true })
  assert.equal(report.dryRun, true)
  assert.equal(report.plan.upload.length, 1)
  assert.equal(report.plan.upload[0].table, 'videos')
  assert.equal(report.plan.upload[0].bucket, 'video-files')
})

test('verifyFileStore 缺数据源时返回失败且不访问网络', async () => {
  const result = await verifyFileStore({})
  assert.equal(result.passed, false)
  assert.equal(result.checks.length, 1)
  assert.equal(result.checks[0].ok, false)
})
