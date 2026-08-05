/**
 * PocketBase 客户端单例。
 * 使用内存认证存储，应用重启后不会自动登录；仅服务器地址写入 localStorage。
 */
import PocketBase, { BaseAuthStore, type RecordModel } from 'pocketbase'

const SERVER_URL_KEY = 'tk-observer-pocketbase-url'
const AUTH_SESSION_KEY = 'tk-observer-pocketbase-session'
const DEFAULT_SERVER_URL =
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/$/, '')
}

export function getStoredServerUrl() {
  return normalizeServerUrl(
    localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL
  )
}

const sessionAuthStore = new BaseAuthStore()
try {
  const storedSession = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (storedSession) {
    const session = JSON.parse(storedSession) as {
      token?: unknown
      record?: unknown
    }
    if (typeof session.token === 'string' && session.record) {
      sessionAuthStore.save(session.token, session.record as RecordModel)
    }
  }
} catch {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

sessionAuthStore.onChange((token, record) => {
  if (token && record) {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, record }))
  } else {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
  }
})

export const pb = new PocketBase(getStoredServerUrl(), sessionAuthStore)
pb.autoCancellation(false)

export async function setPocketBaseUrl(value: string) {
  const url = normalizeServerUrl(value)
  localStorage.setItem(SERVER_URL_KEY, url)
  await clearPocketBaseSession()
  pb.baseURL = url
  return url
}

export async function clearPocketBaseSession() {
  try {
    await pb.realtime.unsubscribe()
  } catch {
    // 实时连接已经断开时，退出仍必须继续清除本地认证状态。
  } finally {
    pb.authStore.clear()
  }
}
