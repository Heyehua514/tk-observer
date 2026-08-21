const DEFAULT_GATEWAY = 'http://127.0.0.1:8877/analyze'

/** 调用用户本机 WorkBuddy 网关，统一处理不可用和异常响应。 */
export async function callWorkBuddyGateway(prompt: string): Promise<string> {
  const endpoint =
    localStorage.getItem('tk.workbuddy.gateway') || DEFAULT_GATEWAY
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch {
    throw new Error('GATEWAY_UNAVAILABLE')
  }
  if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE')

  let data: { ok?: boolean; text?: string }
  try {
    data = (await response.json()) as { ok?: boolean; text?: string }
  } catch {
    throw new Error('GATEWAY_UNAVAILABLE')
  }
  if (!data.ok || !data.text) throw new Error('GATEWAY_UNAVAILABLE')
  return data.text
}
