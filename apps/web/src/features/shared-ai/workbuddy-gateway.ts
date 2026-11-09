import { getSupabaseEnvironment } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'

export const DEFAULT_GATEWAY = 'http://127.0.0.1:8877/analyze'
export const GATEWAY_STORAGE_KEY = 'tk.workbuddy.gateway'
const GATEWAY_TIMEOUT_MS = 125_000
const CLOUD_FUNCTION_PATH = '/functions/v1/ai-proxy'

async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs = GATEWAY_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('AI_TIMEOUT'))
      controller.abort()
    }, timeoutMs)
  })
  try {
    return await Promise.race([task(controller.signal), deadline])
  } finally {
    clearTimeout(timeout)
  }
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
  const { data, error } = await withTimeout(
    () => getSupabaseClient().auth.getSession(),
    8_000
  )
  if (error || !data.session?.access_token) throw new Error('AI_AUTH_REQUIRED')
  const { url, anonKey } = getSupabaseEnvironment()
  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(
        `${url.replace(/\/+$/, '')}${CLOUD_FUNCTION_PATH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ prompt }),
          signal,
        }
      )
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean
        text?: string
        error?: string
      } | null
      if (!response.ok) {
        if (response.status === 401 || payload?.error === 'AUTH_REQUIRED')
          throw new Error('AI_AUTH_REQUIRED')
        if (payload?.error === 'AI_NOT_CONFIGURED')
          throw new Error('AI_NOT_CONFIGURED')
        if (payload?.error === 'AI_UPSTREAM_FAILED')
          throw new Error('AI_UPSTREAM_FAILED')
        if (payload?.error === 'AI_EMPTY_RESPONSE')
          throw new Error('AI_INVALID_RESPONSE')
        throw new Error('AI_CLOUD_UNAVAILABLE')
      }
      if (
        payload?.ok !== true ||
        typeof payload.text !== 'string' ||
        !payload.text.trim()
      )
        throw new Error('AI_INVALID_RESPONSE')
      return payload.text
    })
  } catch (error) {
    if (
      error instanceof Error &&
      [
        'AI_TIMEOUT',
        'AI_AUTH_REQUIRED',
        'AI_NOT_CONFIGURED',
        'AI_UPSTREAM_FAILED',
        'AI_INVALID_RESPONSE',
        'AI_CLOUD_UNAVAILABLE',
      ].includes(error.message)
    )
      throw error
    const failure = new Error('AI_CLOUD_UNAVAILABLE')
    Object.defineProperty(failure, 'cause', { value: error })
    throw failure
  }
}

/**
 * 统一 AI 调用入口：优先本机 WorkBuddy，失败后自动回退云端，
 * 保证换设备登录后仍能使用 AI 能力。
 */
export async function callWorkBuddyGateway(prompt: string): Promise<string> {
  try {
    return await callLocalGateway(prompt)
  } catch {
    return callCloudAiProxy(prompt)
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
