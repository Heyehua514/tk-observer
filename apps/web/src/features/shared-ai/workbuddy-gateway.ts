export const DEFAULT_GATEWAY = 'http://127.0.0.1:8877/analyze'
const GATEWAY_TIMEOUT_MS = 125_000

/** 调用用户本机 WorkBuddy 网关，统一处理不可用和异常响应。 */
export async function callWorkBuddyGateway(prompt: string): Promise<string> {
  const endpoint =
    localStorage.getItem(GATEWAY_STORAGE_KEY) || DEFAULT_GATEWAY
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE')

    const data = (await response.json()) as { ok?: boolean; text?: string }
    if (!data.ok || !data.text) throw new Error('GATEWAY_UNAVAILABLE')
    return data.text
  } catch {
    throw new Error('GATEWAY_UNAVAILABLE')
  } finally {
    clearTimeout(timeout)
  }
}

export const GATEWAY_STORAGE_KEY = 'tk.workbuddy.gateway'

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
