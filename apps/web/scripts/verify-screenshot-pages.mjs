/**
 * 截图回归页面内容自检
 * 用途：登录后逐页确认五个工作台标题渲染成功（防止截图拍到的全是错误页）。
 * 所属工作台：全局（UI 验收）
 * 权限：本地预览服务 + 测试账号，密码从环境变量读取，不落仓库。
 */
import { chromium } from 'playwright'

const BASE = process.env.TK_OBSERVER_BASE_URL ?? 'http://localhost:4173'
const PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''
if (!PASSWORD) {
  console.error('缺少 TK_OBSERVER_TEST_PASSWORD')
  process.exit(1)
}

const checks = [
  { path: '/overview', text: '总览工作台' },
  { path: '/business', text: '商务工作台' },
  { path: '/market', text: '市场工作台' },
  { path: '/design', text: '设计工作台' },
  { path: '/editing', text: '微信视频号内容工作台' },
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.locator('input[type=email]').fill('leige@tk-observer.test')
await page.locator('input[type=password]').fill(PASSWORD)
await page.locator('button[type=submit]').click()
await page.waitForURL('**/overview**', { timeout: 20_000 })

let failed = false
for (const c of checks) {
  await page.goto(`${BASE}${c.path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const body = await page.locator('body').innerText()
  const ok = body.includes(c.text)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.path} 含「${c.text}」`)
  if (!ok) failed = true
}
await browser.close()
process.exit(failed ? 1 : 0)
