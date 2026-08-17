/**
 * PWA Service Worker 注册：仅生产构建注册，dev 模式跳过避免热更新干扰。
 * 所属工作台：全局（应用外壳离线缓存）。
 * 权限：仅注册前端 SW，不涉及数据读写；离线缓存不覆盖 /rest/ 与 /storage/。
 */
export type ServiceWorkerRegistrar = {
  register(url: string, options?: { scope?: string }): Promise<unknown>
}
export type WindowLike = {
  navigator: { serviceWorker?: ServiceWorkerRegistrar }
  addEventListener(type: 'load', listener: () => void): void
}
export type RegisterOptions = { prod?: boolean }

export function registerServiceWorker(
  win: WindowLike | null = null,
  options: RegisterOptions = {}
): void {
  const prod = options.prod ?? import.meta.env.PROD
  if (!prod) return
  const target =
    win ?? (typeof window === 'undefined' ? null : (window as WindowLike))
  if (!target?.navigator.serviceWorker) return
  target.addEventListener('load', () => {
    void target.navigator.serviceWorker!.register('/sw.js').catch((error) => {
      // 注册失败静默降级为普通网页访问，不影响业务可用性。
      void error
    })
  })
}
