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
  await page.evaluate(() => localStorage.clear())
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

/** 1x1 透明 PNG，E2E 文件上传用。 */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)
