/**
 * PocketBase 冻结检查单测
 * 用途：验证冻结线识别（15 个）与目录缺失/超量的失败分支。
 * 所属工作台：全局（后端策略）
 * 权限：仅临时目录读写，不碰仓库文件。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { checkPocketBaseFrozen } from './pocketbase-freeze-check.mjs'

function fixture(count) {
  const dir = mkdtempSync(join(tmpdir(), 'pb-freeze-'))
  mkdirSync(dir, { recursive: true })
  for (let i = 0; i < count; i += 1) {
    writeFileSync(join(dir, `1786000000${String(i).padStart(2, '0')}_m${i}.js`), '')
  }
  return dir
}

test('15 个 migration 判定为已冻结', () => {
  const dir = fixture(15)
  try {
    const result = checkPocketBaseFrozen({ dir })
    assert.equal(result.frozen, true)
    assert.match(result.reason, /已冻结/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('超量 migration 判定为冻结被破坏', () => {
  const dir = fixture(16)
  try {
    const result = checkPocketBaseFrozen({ dir })
    assert.equal(result.frozen, false)
    assert.match(result.reason, /冻结被破坏/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('目录缺失时给出明确原因', () => {
  const result = checkPocketBaseFrozen({ dir: join(tmpdir(), 'no-such-pb-dir-9382') })
  assert.equal(result.frozen, false)
  assert.match(result.reason, /目录缺失/)
})
