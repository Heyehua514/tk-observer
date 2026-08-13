/**
 * PWA manifest / service worker / 注册逻辑测试。
 * 所属工作台：全局（应用外壳离线能力）。
 * 权限：只读校验静态文件与注册逻辑，不访问真实 SW 注册。
 */
import { describe, expect, it } from 'vitest'
import { registerServiceWorker, type WindowLike } from './register-sw'

const manifestUrl = new URL('/manifest.webmanifest', location.href)
const swUrl = new URL('/sw.js', location.href)

describe('PWA manifest', () => {
  it('定义应用标识、展示模式与主题色', async () => {
    const res = await fetch(manifestUrl)
    expect(res.ok).toBe(true)
    const manifest = (await res.json()) as Record<string, unknown>
    expect(manifest.name).toBe('TK观察工作台')
    expect(manifest.short_name).toBe('TK工作台')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe('#1478d7')
    const icons = manifest.icons as Array<{ sizes: string; purpose?: string }>
    expect(icons.some((icon) => icon.sizes === '192x192')).toBe(true)
    expect(icons.some((icon) => icon.sizes === '512x512')).toBe(true)
    expect(icons.some((icon) => icon.sizes === '512x512' && icon.purpose?.includes('maskable'))).toBe(
      true
    )
  })

  it('manifest 引用的图标文件可访问', async () => {
    for (const size of ['192', '512']) {
      const icon = await fetch(new URL(`/images/pwa-${size}.png`, location.href))
      expect(icon.ok).toBe(true)
      expect(icon.headers.get('content-type')).toMatch(/png/)
    }
  })

  it('index.html 装配了 manifest 与移动端启动配置', async () => {
    const res = await fetch(new URL('/', location.href))
    expect(res.ok).toBe(true)
    const html = await res.text()
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('name="theme-color" content="#1478d7"')
    expect(html).toContain('rel="apple-touch-icon" href="/images/pwa-192.png"')
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"')
  })
})

describe('service worker', () => {
  it('预缓存应用外壳并按 Network First 回退', async () => {
    const res = await fetch(swUrl)
    expect(res.ok).toBe(true)
    const source = await res.text()
    expect(source).toContain('tk-observer-shell-v1')
    expect(source).toContain("'/'")
    expect(source).toContain("'/login'")
    expect(source).toContain('/manifest.webmanifest')
    expect(source).toContain('skipWaiting')
    expect(source).toContain('Network first')
    expect(source).toContain('/rest/')
  })
})

describe('registerServiceWorker', () => {
  const makeWindow = (): {
    win: WindowLike
    listeners: Array<() => void>
    registered: string[]
  } => {
    const listeners: Array<() => void> = []
    const registered: string[] = []
    const win: WindowLike = {
      navigator: {
        serviceWorker: {
          register: async (url: string) => {
            registered.push(url)
            return Promise.resolve()
          },
        },
      },
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'load') listeners.push(listener)
      },
    }
    return { win, listeners, registered }
  }

  it('dev 模式不注册 SW', () => {
    const { win, listeners, registered } = makeWindow()
    registerServiceWorker(win, { prod: false })
    expect(listeners).toHaveLength(0)
    expect(registered).toHaveLength(0)
  })

  it('生产模式在 load 后注册 /sw.js', () => {
    const { win, listeners, registered } = makeWindow()
    registerServiceWorker(win, { prod: true })
    expect(listeners).toHaveLength(1)
    listeners[0]()
    expect(registered).toEqual(['/sw.js'])
  })

  it('不支持 SW 的浏览器静默跳过', () => {
    const win: WindowLike = {
      navigator: {},
      addEventListener: () => {},
    }
    expect(() => registerServiceWorker(win, { prod: true })).not.toThrow()
  })
})
