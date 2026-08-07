/**
 * 用途：评估复杂依赖图的影响范围和派生状态是否保持一致。
 * 权限：只运行内存中的确定性图计算，不访问或修改 PocketBase 数据。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const { buildSnapshot, affectedDownstream } = require('../pb_hooks/lib/dependency-engine.js')

test('branching workflow reports complete impact without duplicate nodes', () => {
  const nodes = [
    { id: 'a', status: 'blocked', deadline: '2026-08-08T00:00:00.000Z' },
    { id: 'b', status: 'todo', deadline: '2026-08-09T00:00:00.000Z' },
    { id: 'c', status: 'todo', deadline: '2026-08-09T00:00:00.000Z' },
    { id: 'd', status: 'todo', deadline: '2026-08-10T00:00:00.000Z' },
  ]
  const edges = [
    { from: 'a', to: 'b', type: 'hard' },
    { from: 'a', to: 'c', type: 'hard' },
    { from: 'b', to: 'd', type: 'hard' },
    { from: 'c', to: 'd', type: 'hard' },
  ]

  assert.deepEqual(affectedDownstream('a', edges), ['b', 'c', 'd'])
  assert.equal(buildSnapshot(nodes, edges, new Date('2026-08-07T00:00:00.000Z')).nodesState.filter((node) => node.blocked).length, 4)
})

