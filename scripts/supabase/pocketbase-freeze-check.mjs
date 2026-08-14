/**
 * PocketBase 冻结状态检查（只读）
 * 用途：项目已全面切到 Supabase-first，PocketBase 仅作显式回退。此脚本确保已发布
 *      migration 数量保持冻结，防止业务迭代继续向 PocketBase 堆叠双份后端逻辑。
 * 所属工作台：全局（后端策略）
 * 权限：只读检查，不启动服务、不访问网络、不写库。
 */
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const FROZEN_MIGRATION_COUNT = 15
export const POCKETBASE_MIGRATIONS_DIR = fileURLToPath(
  new URL('../../backend/pb_migrations', import.meta.url)
)

export function checkPocketBaseFrozen({
  dir = POCKETBASE_MIGRATIONS_DIR,
  expected = FROZEN_MIGRATION_COUNT,
} = {}) {
  if (!existsSync(dir)) {
    return { frozen: false, reason: 'backend/pb_migrations 目录缺失', files: [] }
  }
  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.js'))
    .sort()
  return {
    frozen: files.length === expected,
    reason:
      files.length === expected
        ? `PocketBase 已冻结：${files.length} 个 migration，仅作显式回退`
        : `PocketBase 冻结被破坏：当前 ${files.length} 个 migration，预期 ${expected}；新业务一律走 Supabase migration`,
    files,
  }
}

function main() {
  const result = checkPocketBaseFrozen()
  console.log(`PocketBase migrations: ${result.files.length}（冻结线 ${FROZEN_MIGRATION_COUNT}）`)
  console.log(result.reason)
  if (!result.frozen) process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
