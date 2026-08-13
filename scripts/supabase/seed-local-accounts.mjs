/**
 * 本地 Supabase 验收账号幂等创建
 * 用途：通过 GoTrue admin API 创建 6 个本地测试账号（boss/business/design/editing/market）并输出 profiles 幂等 upsert SQL。
 * 所属工作台：全局（本地开发环境）
 * 权限：需要本地 Supabase service role key（SUPABASE_SERVICE_ROLE_KEY）与测试密码（TK_OBSERVER_TEST_PASSWORD），均不落仓库；
 *       profiles 写入由数据库管理员用输出 SQL 执行（docker exec psql）。SQL 只输出到 stdout，进度输出到 stderr。
 */
const BASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''
const SQL_ONLY = process.argv.includes('--sql-only')

if (!SERVICE_KEY || !PASSWORD) {
  console.error('需要 SUPABASE_SERVICE_ROLE_KEY 与 TK_OBSERVER_TEST_PASSWORD 环境变量')
  process.exit(1)
}

const ACCOUNTS = [
  { name: '磊哥', email: 'leige@tk-observer.test', role: 'boss' },
  { name: '董雨辰', email: 'dongyuchen@tk-observer.test', role: 'business' },
  { name: '杨振康', email: 'yangzhenkang@tk-observer.test', role: 'business' },
  { name: '孙铭泽', email: 'sunmingze@tk-observer.test', role: 'design' },
  { name: '谢洁', email: 'xiejie@tk-observer.test', role: 'editing' },
  { name: '韩素云', email: 'hansuyun@tk-observer.test', role: 'market' },
]

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.status === 204 ? null : res.json()
}

let created = 0
let existing = 0
const rows = []
for (const account of ACCOUNTS) {
  const listRes = await api('/auth/v1/admin/users?per_page=1000')
  const found = listRes.users?.find((u) => u.email === account.email)
  let userId
  if (found) {
    userId = found.id
    existing += 1
  } else {
    const createdUser = await api('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: account.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: account.name },
      }),
    })
    userId = createdUser.id
    created += 1
  }
  rows.push({ id: userId, name: account.name, role: account.role })
  console.error(`- ${account.name} (${account.email}, ${account.role})`)
}

if (SQL_ONLY) {
  const values = rows
    .map((r) => `('${r.id}', '${r.name.replace(/'/g, "''")}', '${r.role}', 'active')`)
    .join(',\n  ')
  console.log('begin;')
  console.log(
    `insert into public.profiles (id, name, role, status) values\n  ${values}\n  on conflict (id) do update set name = excluded.name, role = excluded.role, status = excluded.status;`
  )
  console.log('commit;')
}

console.error(`账号就绪：新建 ${created}，已存在 ${existing}${SQL_ONLY ? '（profiles 请用上方 SQL 执行）' : ''}`)
