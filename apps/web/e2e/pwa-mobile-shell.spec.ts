/**
 * PWA 离线壳 + 移动端视口端到端
 * 用途：验证生产构建的 manifest 元数据、service worker 注册与控制、离线外壳回退、移动端视口无横向溢出。
 * 所属工作台：全局（PWA / 移动端可用性）
 * 权限：无需登录；需要 vite preview 生产构建服务（playwright.config 自动派生）。
 */
import { expect, test, devices } from 'playwright/test'

/** evaluate 回调内访问浏览器全局（e2e tsconfig 无 DOM lib，用结构化收窄避免 any）。 */
type SwGlobals = {
  navigator: {
    serviceWorker?: {
      getRegistration(scope: string): Promise<{ active: { state: string } | null } | null>
      controller: unknown
    }
  }
}

type DocGlobals = {
  document: { documentElement: { scrollWidth: number; clientWidth: number } }
}

test.describe('PWA 移动端外壳', () => {
  test('manifest 元数据可访问且图标可加载', async ({ page }) => {
    await page.goto('/login')
    const res = await page.request.get('/manifest.webmanifest')
    expect(res.ok()).toBe(true)
    const manifest = (await res.json()) as {
      name: string
      short_name: string
      start_url: string
      display: string
      theme_color: string
      icons: Array<{ src: string; sizes: string; purpose?: string }>
    }
    expect(manifest.name).toBe('TK观察工作台')
    expect(manifest.short_name).toBe('TK工作台')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    for (const icon of manifest.icons) {
      const iconRes = await page.request.get(icon.src)
      expect(iconRes.ok(), `图标可访问: ${icon.src}`).toBe(true)
    }
  })

  test('service worker 注册并被接管', async ({ page }) => {
    await page.goto('/login')
    await page.waitForFunction(() =>
      (globalThis as unknown as SwGlobals).navigator.serviceWorker
        ?.getRegistration('/')
        .then((reg) => reg?.active?.state === 'activated')
    )
    // 重载一次，让 service worker 接管页面并完成运行时缓存
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(
      () =>
        (globalThis as unknown as SwGlobals).navigator.serviceWorker?.controller !=
        null
    )
    await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible()
  })

  test('离线状态应用外壳仍可渲染', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/login')
    await page.waitForFunction(() =>
      (globalThis as unknown as SwGlobals).navigator.serviceWorker
        ?.getRegistration('/')
        .then((reg) => reg?.active?.state === 'activated')
    )
    // 在线重载两次：SW 接管本次加载，把外壳与 JS 资源写入运行时缓存
    await page.reload({ waitUntil: 'load' })
    await page.reload({ waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible()

    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText('看清信号，进入行动')).toBeVisible()
    await expect(page.locator('input[type=email]')).toBeVisible()
    await context.setOffline(false)
    await context.close()
  })

  test('移动端视口登录页无横向溢出', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 13'] })
    const page = await context.newPage()
    await page.goto('/login')
    await expect(page.getByText('登录工作台')).toBeVisible()
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: (globalThis as unknown as DocGlobals).document.documentElement
        .scrollWidth,
      clientWidth: (globalThis as unknown as DocGlobals).document.documentElement
        .clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    await context.close()
  })
})
