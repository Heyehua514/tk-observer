/**
 * E2E 通用登录辅助
 * 用途：多角色账号登录与会话切换。
 * 所属工作台：全局（质量门禁）
 * 权限：需要本地 Supabase 与 6 个测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import type { Page } from 'playwright/test'

export const TEST_PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''

export const accounts = {
  boss: 'leige@tk-observer.test',
  business: 'dongyuchen@tk-observer.test',
  market: 'hansuyun@tk-observer.test',
  design: 'sunmingze@tk-observer.test',
  editing: 'xiejie@tk-observer.test',
} as const

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.locator('input[type=email]').fill(email)
  await page.locator('input[type=password]').fill(TEST_PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/\/(overview|business|market|design|editing)/)
  await page.waitForLoadState('domcontentloaded')
}

export async function switchAccount(page: Page, email: string) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
  await login(page, email)
}

/**
 * 读取本地 .env 中的 Supabase 连接参数（仅本地 E2E 清理数据用）。
 * 用途：测试软删除自己创建的商机，避免残留污染 pgTAP 全表计数。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadSupabaseEnv() {
  const envPath = resolve(process.cwd(), '.env')
  const text = readFileSync(envPath, 'utf8')
  const get = (key: string) => {
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
  }
  return { url: get('VITE_SUPABASE_URL'), anonKey: get('VITE_SUPABASE_ANON_KEY') }
}

/**
 * 用当前页面登录态软删除测试商机（business 有 update 权限）。
 */
export async function softDeleteOpportunity(
  page: Page,
  title: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, title }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/opportunities?title=eq.${encodeURIComponent(title)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, title }
  )
}

/**
 * 用当前页面登录态软删除测试渠道商单（business 有 update 权限）。
 */
export async function softDeleteChannelOrder(
  page: Page,
  title: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, title }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/channel_orders?title=eq.${encodeURIComponent(title)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, title }
  )
}

/**
 * 用当前页面登录态读取商机跟进备注（business 对 opportunities 可读）。
 * 用途：验证朋友圈复盘后触发器自动追加「来源：朋友圈」。
 */
export async function readOpportunityNotes(
  page: Page,
  title: string
): Promise<string> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return ''
  return page.evaluate(
    async ({ url, anonKey, title }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return ''
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/opportunities?title=eq.${encodeURIComponent(title)}&select=notes`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) return ''
      const rows = (await res.json()) as Array<{ notes: string | null }>
      return rows[0]?.notes ?? ''
    },
    { url, anonKey, title }
  )
}

/**
 * 用当前页面登录态软删除测试设计素材（design 有 update 权限）。
 */
export async function softDeleteDesignAsset(
  page: Page,
  fileName: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, fileName }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/design_assets?file_name=eq.${encodeURIComponent(fileName)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, fileName }
  )
}

/**
 * 用当前页面登录态软删除测试场地（market 有 update 权限）。
 */
export async function softDeleteVenue(
  page: Page,
  name: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, name }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/venues?name=eq.${encodeURIComponent(name)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, name }
  )
}

/**
 * 用当前页面登录态按名称前缀软删除测试场地（market 有 update 权限）。
 * 用途：清理历史失败运行残留的 E2E 场地，避免污染筛选/匹配断言。
 */
export async function softDeleteVenuesByPrefix(
  page: Page,
  prefix: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, prefix }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/venues?name=like.${encodeURIComponent(
          `${prefix}%`
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(
          `${url}/rest/v1/venues?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
          }
        )
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, prefix }
  )
}

/**
 * 用当前页面登录态按内容前缀软删除朋友圈测试计划（business 有 update 权限）。
 * 用途：清理历史失败运行残留的 E2E 计划，避免污染日历断言。
 */
export async function softDeleteSocialPlansByPrefix(
  page: Page,
  prefix: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, prefix }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/social_plans?content=like.${encodeURIComponent(
          `${prefix}%`
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(
          `${url}/rest/v1/social_plans?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
          }
        )
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, prefix }
  )
}

/**
 * 用当前页面登录态插入测试达人（editing 有 insert 权限）。
 * 用途：达人商务标记 E2E 前置数据，插入后由测试切换角色完成标记。
 */
export async function insertCreator(
  page: Page,
  fields: { nickname: string; tiktokUrl: string; followers?: number; region?: string }
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, fields }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(`${url}/rest/v1/creators`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          nickname: fields.nickname,
          tiktok_url: fields.tiktokUrl,
          followers: fields.followers ?? 1000,
          region: fields.region ?? 'US',
          cooperation_status: 'pending',
          owner_name: '谢洁',
          commission_rate: 10,
          is_biz_available: false,
        }),
      })
      return res.ok
    },
    { url, anonKey, fields }
  )
}

/**
 * 用当前页面登录态按昵称前缀软删除测试达人（editing/owner 有 update 权限）。
 */
export async function softDeleteCreatorsByPrefix(
  page: Page,
  prefix: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, prefix }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/creators?nickname=like.${encodeURIComponent(
          `${prefix}%`
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(
          `${url}/rest/v1/creators?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
          }
        )
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, prefix }
  )
}

/**
 * 用当前页面登录态按唯一名查询行 id（表须对当前角色可见）。
 */
export async function findRowId(
  page: Page,
  table: string,
  column: string,
  value: string
): Promise<string> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return ''
  return page.evaluate(
    async ({ url, anonKey, table, column, value }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return ''
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=id`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) return ''
      const rows = (await res.json()) as Array<{ id: string }>
      return rows[0]?.id ?? ''
    },
    { url, anonKey, table, column, value }
  )
}

/**
 * 用当前页面登录态插入一条活动招商意向（market 有插入权限）。
 */
export async function insertEventSponsorship(
  page: Page,
  fields: {
    eventId: string
    clientId: string
    contactName: string
    amount: number
  }
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, fields }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(`${url}/rest/v1/event_sponsorships`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          event_id: fields.eventId,
          client_id: fields.clientId,
          contact_name: fields.contactName,
          amount: fields.amount,
          stage: 'intent',
        }),
      })
      return res.ok
    },
    { url, anonKey, fields }
  )
}

/**
 * 用当前页面登录态软删除活动招商记录（business 有 update 权限）。
 */
export async function softDeleteSponsorship(
  page: Page,
  eventId: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, eventId }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/event_sponsorships?event_id=eq.${eventId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, eventId }
  )
}

/**
 * 用当前页面登录态按字段前缀软删除指定表记录（调用方需持有该表的 update 权限）。
 * 用途：设计需求/参考/交付记录 E2E 回收，避免残留污染计数。
 */
export async function softDeleteRowsByFieldPrefix(
  page: Page,
  table:
    | 'design_requirements'
    | 'design_references'
    | 'design_deliverables'
    | 'competitor_accounts'
    | 'competitor_videos'
    | 'competitor_style_analysis'
    | 'trending_topics',
  field: string,
  prefix: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, table, field, prefix }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/${table}?${field}=like.${encodeURIComponent(
          `${prefix}%`
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(`${url}/rest/v1/${table}?id=eq.${row.id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        })
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, table, field, prefix }
  )
}

/**
 * 用当前页面登录态按字段精确值软删除指定表记录（调用方需持有该表的 update 权限）。
 * 用途：按 uuid 外键清理子表（uuid 不支持 like 通配），如风格分析按对标账号 id 回收。
 */
export async function softDeleteRowsByFieldValue(
  page: Page,
  table: string,
  field: string,
  value: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, table, field, value }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/${table}?${field}=eq.${encodeURIComponent(
          value
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(`${url}/rest/v1/${table}?id=eq.${row.id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        })
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, table, field, value }
  )
}

/**
 * 用当前页面登录态按字段前缀软删除任意软删表记录（调用方需持有该表的 update 权限）。
 * 用途：E2E 历史失败残留清理，避免同名前缀脏数据污染断言。
 */
export async function softDeleteRowsByFieldLike(
  page: Page,
  table: string,
  field: string,
  prefix: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, table, field, prefix }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      }
      const list = await fetch(
        `${url}/rest/v1/${table}?${field}=like.${encodeURIComponent(
          `${prefix}%`
        )}&deleted_at=is.null&select=id`,
        { headers }
      )
      if (!list.ok) return false
      const rows = (await list.json()) as Array<{ id: string }>
      let cleaned = 0
      for (const row of rows) {
        const res = await fetch(`${url}/rest/v1/${table}?id=eq.${row.id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        })
        if (res.ok) cleaned += 1
      }
      return cleaned > 0
    },
    { url, anonKey, table, field, prefix }
  )
}

/** 1x1 透明 PNG，E2E 文件上传用。 */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

/**
 * 用当前页面登录态插入对标账号（editing 有 insert 权限）。
 * 用途：剪辑工作台对标录入 E2E 前置数据，测试后软删回收。
 */
export async function insertCompetitorAccount(
  page: Page,
  fields: {
    name: string
    platform?: string
    category?: string
    followerCount?: number
    avgViews?: number
  }
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, fields }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(`${url}/rest/v1/competitor_accounts`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: fields.name,
          platform: fields.platform ?? '视频号',
          category: fields.category ?? '出海跨境',
          follower_count: fields.followerCount ?? 10000,
          avg_views: fields.avgViews ?? 2000,
        }),
      })
      return res.ok
    },
    { url, anonKey, fields }
  )
}

/**
 * 用当前页面登录态插入活动阶段（market 有插入权限），返回新阶段 id。
 * 用途：任务看板 E2E 前置数据，测试后按活动软删回收。
 */
export async function insertEventPhase(
  page: Page,
  fields: { eventId: string; name: string; phaseOrder: number }
): Promise<string> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return ''
  return page.evaluate(
    async ({ url, anonKey, fields }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return ''
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(`${url}/rest/v1/event_phases`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          event_id: fields.eventId,
          name: fields.name,
          phase_order: fields.phaseOrder,
        }),
      })
      if (!res.ok) return ''
      const rows = (await res.json()) as Array<{ id: string }>
      return rows[0]?.id ?? ''
    },
    { url, anonKey, fields }
  )
}

/**
 * 用当前页面登录态插入活动任务（market 有插入权限）。
 * 用途：任务看板 E2E 前置数据，测试后按活动软删回收。
 */
export async function insertEventTask(
  page: Page,
  fields: {
    eventId: string
    phaseId: string
    title: string
    assigneeRole: string
    status?: string
  }
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, fields }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(`${url}/rest/v1/event_tasks`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          event_id: fields.eventId,
          phase_id: fields.phaseId,
          title: fields.title,
          assignee_role: fields.assigneeRole,
          status: fields.status ?? 'todo',
        }),
      })
      return res.ok
    },
    { url, anonKey, fields }
  )
}

/**
 * 用当前页面登录态按活动软删任务/阶段（market 有 update 权限）。
 * 用途：任务看板 E2E 回收，避免残留污染计数。
 */
export async function softDeleteEventTasks(
  page: Page,
  eventId: string
): Promise<boolean> {
  return softDeleteRowsByFieldValue(page, 'event_tasks', 'event_id', eventId)
}

export async function softDeleteEventPhases(
  page: Page,
  eventId: string
): Promise<boolean> {
  return softDeleteRowsByFieldValue(page, 'event_phases', 'event_id', eventId)
}

/**
 * 用当前页面登录态软删活动（market 有 update 权限）。
 * 用途：任务看板 E2E 回收，与 UI「删除活动」行为一致。
 */
export async function softDeleteEvent(
  page: Page,
  eventId: string
): Promise<boolean> {
  const { url, anonKey } = loadSupabaseEnv()
  if (!url || !anonKey) return false
  return page.evaluate(
    async ({ url, anonKey, eventId }) => {
      const entry = Object.entries(localStorage).find(([key]) =>
        key.includes('auth-token')
      )
      if (!entry) return false
      const token = JSON.parse(entry[1]).access_token
      const res = await fetch(
        `${url}/rest/v1/events?id=eq.${eventId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() }),
        }
      )
      return res.ok
    },
    { url, anonKey, eventId }
  )
}
