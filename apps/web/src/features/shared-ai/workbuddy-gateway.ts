import { getSupabaseEnvironment } from '@/lib/data-provider'

export const DEFAULT_GATEWAY = 'http://127.0.0.1:8877/analyze'
export const GATEWAY_STORAGE_KEY = 'tk.workbuddy.gateway'
const GATEWAY_TIMEOUT_MS = 125_000
const CLOUD_FUNCTION_PATH = '/functions/v1/ai-proxy'

/** 从 Supabase 本地会话中读取 access token，不触发网络请求。 */
export function readSupabaseAccessToken(): string {
  if (typeof localStorage === 'undefined') return ''
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || ''
    if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as { access_token?: unknown }
      if (typeof parsed.access_token === 'string' && parsed.access_token) {
        return parsed.access_token
      }
    } catch {
      // 忽略损坏的会话缓存，继续查找其他条目
    }
  }
  return ''
}

function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS)
  return task(controller.signal).finally(() => clearTimeout(timeout))
}

/** 调用本机 WorkBuddy 网关；失败时由上层决定是否回退云端。 */
async function callLocalGateway(prompt: string): Promise<string> {
  const endpoint = localStorage.getItem(GATEWAY_STORAGE_KEY) || DEFAULT_GATEWAY
  return withTimeout(async (signal) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    })
    if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE')
    const data = (await response.json()) as { ok?: boolean; text?: string }
    if (!data.ok || !data.text) throw new Error('GATEWAY_UNAVAILABLE')
    return data.text
  })
}

/** 通过 Supabase Edge Function 调用云端模型，供没有本机 WorkBuddy 的设备使用。 */
export async function callCloudAiProxy(prompt: string): Promise<string> {
  const token = readSupabaseAccessToken()
  if (!token) throw new Error('AI_CLOUD_UNAVAILABLE')
  const { url, anonKey } = getSupabaseEnvironment()
  return withTimeout(async (signal) => {
    const response = await fetch(`${url.replace(/\/+$/, '')}${CLOUD_FUNCTION_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
      signal,
    })
    if (!response.ok) throw new Error('AI_CLOUD_UNAVAILABLE')
    const data = (await response.json()) as { ok?: boolean; text?: string }
    if (!data.ok || !data.text) throw new Error('AI_CLOUD_UNAVAILABLE')
    return data.text
  })
}

/**
 * 统一 AI 调用入口：优先本机 WorkBuddy，失败后自动回退云端，
 * 保证换设备登录后仍能使用 AI 能力。
 */
export async function callWorkBuddyGateway(prompt: string): Promise<string> {
  try {
    return await callLocalGateway(prompt)
  } catch {
    try {
      return await callCloudAiProxy(prompt)
    } catch {
      throw new Error('GATEWAY_UNAVAILABLE')
    }
  }
}

export function getStoredGatewayUrl(): string {
  return localStorage.getItem(GATEWAY_STORAGE_KEY) || DEFAULT_GATEWAY
}

export function setStoredGatewayUrl(url: string): void {
  const trimmed = url.trim()
  if (!trimmed || trimmed === DEFAULT_GATEWAY) {
    localStorage.removeItem(GATEWAY_STORAGE_KEY)
  } else {
    localStorage.setItem(GATEWAY_STORAGE_KEY, trimmed)
  }
}
