/**
 * 用途：任务依赖排序、传播、延期和升级规则的服务端契约测试。
 * 权限：测试进程只读取纯逻辑模块，不访问或修改 PocketBase 数据。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const {
  affectedDownstream,
  buildSnapshot,
  findBlockedDownstream,
  findOverdueNodes,
  shouldEscalateBlock,
  topologicalSort,
} = require('../pb_hooks/lib/dependency-engine.js')

const nodes = [
  { id: 'brief', status: 'blocked', deadline: '2026-08-05T00:00:00.000Z' },
  { id: 'design', status: 'todo', deadline: '2026-08-09T00:00:00.000Z' },
  { id: 'publish', status: 'todo', deadline: '2026-08-10T00:00:00.000Z' },
  { id: 'legal', status: 'done', deadline: '2026-08-01T00:00:00.000Z' },
]
const edges = [
  { from: 'brief', to: 'design', type: 'hard' },
  { from: 'design', to: 'publish', type: 'hard' },
  { from: 'legal', to: 'publish', type: 'soft' },
]

test('topologically sorts a DAG and rejects a cycle', () => {
  assert.deepEqual(topologicalSort(nodes, edges), [
    'brief',
    'legal',
    'design',
    'publish',
  ])
  assert.throws(
    () => topologicalSort(nodes, [...edges, { from: 'publish', to: 'brief', type: 'hard' }]),
    /cycle/i,
  )
})

test('propagates blocked state through hard dependencies only', () => {
  assert.deepEqual(findBlockedDownstream(nodes, edges), ['design', 'publish'])
  assert.deepEqual(
    findBlockedDownstream(
      [{ id: 'legal', status: 'blocked' }, { id: 'publish', status: 'todo' }],
      [{ from: 'legal', to: 'publish', type: 'soft' }],
    ),
    [],
  )
})

test('BFS returns every affected downstream node once', () => {
  assert.deepEqual(affectedDownstream('brief', edges), ['design', 'publish'])
})

test('marks only unfinished past-deadline nodes overdue', () => {
  assert.deepEqual(
    findOverdueNodes(nodes, new Date('2026-08-07T00:00:00.000Z')),
    ['brief'],
  )
})

test('escalates unresolved blocks at the inclusive three-day boundary', () => {
  const now = new Date('2026-08-07T00:00:00.000Z')
  assert.equal(
    shouldEscalateBlock({ blockedAt: '2026-08-04T00:00:00.000Z', resolvedAt: '' }, now),
    true,
  )
  assert.equal(
    shouldEscalateBlock({ blockedAt: '2026-08-05T00:00:00.000Z', resolvedAt: '' }, now),
    false,
  )
  assert.equal(
    shouldEscalateBlock({ blockedAt: '2026-08-01T00:00:00.000Z', resolvedAt: '2026-08-02T00:00:00.000Z' }, now),
    false,
  )
})

test('snapshot preserves graph state and derived blocked and overdue flags', () => {
  const snapshot = buildSnapshot(nodes, edges, new Date('2026-08-07T00:00:00.000Z'))
  assert.deepEqual(snapshot.edges, edges)
  assert.deepEqual(snapshot.nodesState, [
    { id: 'brief', status: 'blocked', blocked: true, overdue: true },
    { id: 'design', status: 'todo', blocked: true, overdue: false },
    { id: 'publish', status: 'todo', blocked: true, overdue: false },
    { id: 'legal', status: 'done', blocked: false, overdue: false },
  ])
})

