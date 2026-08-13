/**
 * 界面截图回归（Playwright）
 * 用途：对登录页与五个工作台页面截图，输出到桌面 PRD 交付包 前端截图回归 目录。
 * 所属工作台：全局（UI 验收）
 * 权限：需要本地已构建产物 + vite preview 服务；测试账号密码从环境变量 TK_OBSERVER_TEST_PASSWORD 读取，不落仓库。
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = process.env.TK_OBSERVER_BASE_URL ?? 'http://127.0.0.1:4173'
const PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''
const EMAIL = process.env.TK_OBSERVER_TEST_EMAIL ?? 'leige@tk-observer.test'
const OUT_DIR =
  process.env.TK_OBSERVER_SCREENSHOT_DIR ??
  '/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/前端截图回归-2026-08-13'

if (!PASSWORD) {
  console.error('缺少 TK_OBSERVER_TEST_PASSWORD，无法登录')
  process.exit(1)
}

const pages = [
  { path: '/overview', file: '02-总览工作台.png' },
  { path: '/business', file: '03-商务工作台.png' },
  { path: '/market', file: '04-市场工作台.png' },
  { path: '/design', file: '05-设计工作台.png' },
  { path: '/editing', file: '06-剪辑工作台.png' },
]

async function waitForSettle(page, timeoutMs = 20_000) {
  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutMs })
  } catch {
    // 动画/长连接可能阻止 networkidle，忽略继续。
  }
  await page.waitForTimeout(800)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await mkdir(OUT_DIR, { recursive: true })

// 登录页
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await waitForSettle(page)
await page.screenshot({ path: resolve(OUT_DIR, '01-登录页.png'), fullPage: true })

// 登录（磊哥 boss）
await page.locator('input[type=email]').fill(EMAIL)
await page.locator('input[type=password]').fill(PASSWORD)
await page.locator('button[type=submit]').click()
await page.waitForURL('**/overview**', { timeout: 20_000 })
await waitForSettle(page)
await page.screenshot({ path: resolve(OUT_DIR, '02-总览工作台.png'), fullPage: true })

for (const item of pages.slice(1)) {
  await page.goto(`${BASE}${item.path}`, { waitUntil: 'domcontentloaded' })
  await waitForSettle(page)
  await page.screenshot({ path: resolve(OUT_DIR, item.file), fullPage: true })
}

const manifest = {
  generated_at: new Date().toISOString(),
  base_url: BASE,
  account: EMAIL,
  viewport: '1440x900',
  files: [
    '01-登录页.png',
    ...pages.map((p) => p.file),
  ],
}
await writeFile(resolve(OUT_DIR, 'README.md'), [
  '# TK观察工作台 前端截图回归 2026-08-13',
  '',
  `生成时间：${manifest.generated_at}`,
  `预览地址：${manifest.base_url}`,
  `登录账号：${manifest.account}`,
  `视口：1440x900`,
  '',
  '| 序号 | 页面 | 文件 |',
  '| --- | --- | --- |',
  ...manifest.files.map((f, i) => `| ${i + 1} | ${f.replace(/^\d+-/, '').replace('.png', '')} | ${f} |`),
  '',
].join('\n'))
await browser.close()
console.log(`截图完成：${OUT_DIR}`)
