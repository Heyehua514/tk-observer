/** 桌面端更新配置契约；未配置签名与清单时必须显式降级。 */
export type DesktopUpdaterEnvironment = {
  endpoint?: string
  publicKey?: string
  currentVersion?: string
}

export type DesktopUpdaterConfig = {
  configured: boolean
  missing: Array<'endpoint' | 'publicKey'>
  currentVersion: string
}

export type DesktopUpdaterStatus = {
  state: 'not-configured' | 'ready'
  message: string
}

export const DESKTOP_UPDATER_ENDPOINT =
  'https://github.com/Heyehua514/tk-observer/releases/latest/download/latest.json'
export const DESKTOP_UPDATER_PUBLIC_KEY =
  'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEVFMzE3QTA2NzAzNjY5REIKUldUYmFUWndCbm94N3U3TDJINGovM0NzZ0Q1R2tqNjJWV1daTUZDbkZxanNuV0lnRmRTTnFuaWsK'

export function getDesktopUpdaterConfig(
  environment: DesktopUpdaterEnvironment
): DesktopUpdaterConfig {
  const missing: DesktopUpdaterConfig['missing'] = []
  if (!environment.endpoint?.trim()) missing.push('endpoint')
  if (!environment.publicKey?.trim()) missing.push('publicKey')
  return {
    configured: missing.length === 0,
    missing,
    currentVersion: environment.currentVersion?.trim() || 'unknown',
  }
}

export function getDesktopUpdaterStatus(
  environment: DesktopUpdaterEnvironment
): DesktopUpdaterStatus {
  return getDesktopUpdaterConfig(environment).configured
    ? { state: 'ready', message: '桌面端更新服务已就绪' }
    : { state: 'not-configured', message: '桌面端更新服务尚未配置' }
}

export function getRuntimeDesktopUpdaterEnvironment(): DesktopUpdaterEnvironment {
  return {
    endpoint: import.meta.env.VITE_DESKTOP_UPDATER_ENDPOINT || DESKTOP_UPDATER_ENDPOINT,
    publicKey: import.meta.env.VITE_DESKTOP_UPDATER_PUBLIC_KEY || DESKTOP_UPDATER_PUBLIC_KEY,
    currentVersion: import.meta.env.VITE_DESKTOP_APP_VERSION,
  }
}
