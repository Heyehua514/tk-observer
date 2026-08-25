import { afterEach, expect, it, vi } from 'vitest'
import { callWorkBuddyGateway } from './workbuddy-gateway'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.removeItem('tk.workbuddy.gateway')
})

it('posts a prompt to the configured gateway and returns text', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true, text: '分析结果' }), {
      status: 200,
    })
  )
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('tk.workbuddy.gateway', 'http://gateway.test/analyze')

  await expect(callWorkBuddyGateway('分析任务')).resolves.toBe('分析结果')
  expect(fetchMock).toHaveBeenCalledWith(
    'http://gateway.test/analyze',
    expect.objectContaining({ method: 'POST' })
  )
})

it('normalizes gateway failures to a stable error', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('bad', { status: 503 }))
  )
  await expect(callWorkBuddyGateway('分析任务')).rejects.toMatchObject({
    message: 'GATEWAY_UNAVAILABLE',
  })
})

it('aborts a stalled gateway request after the client deadline', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new Error('aborted'))
      )
    })
  })
  vi.stubGlobal('fetch', fetchMock)

  const request = callWorkBuddyGateway('分析任务')
  const signal = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)
    ?.signal
  expect(signal).toBeInstanceOf(AbortSignal)
  expect(signal?.aborted).toBe(false)

  await vi.advanceTimersByTimeAsync(125_000)
  await expect(request).rejects.toMatchObject({
    message: 'GATEWAY_UNAVAILABLE',
  })
  expect(signal?.aborted).toBe(true)
})
