import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_GATEWAY,
  callWorkBuddyGateway,
  getStoredGatewayUrl,
  setStoredGatewayUrl,
} from './workbuddy-gateway'

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

describe('workbuddy-gateway storage utilities', () => {
  it('returns DEFAULT_GATEWAY when nothing is stored', () => {
    localStorage.removeItem('tk.workbuddy.gateway')
    expect(getStoredGatewayUrl()).toBe(DEFAULT_GATEWAY)
  })

  it('stores and retrieves custom gateway url', () => {
    setStoredGatewayUrl('http://192.168.1.100:8877/analyze')
    expect(getStoredGatewayUrl()).toBe('http://192.168.1.100:8877/analyze')
    localStorage.removeItem('tk.workbuddy.gateway')
  })
})

describe('cloud ai fallback', () => {
  afterEach(() => {
    localStorage.removeItem('sb-test-auth-token')
  })

  it('falls back to the supabase ai-proxy when the local gateway is offline', async () => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'token-1' }))
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, text: '云端分析结果' }), { status: 200 })
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(callWorkBuddyGateway('分析任务')).resolves.toBe('云端分析结果')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain('/functions/v1/ai-proxy')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
    })
  })

  it('keeps the stable error when neither channel is available', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(callWorkBuddyGateway('分析任务')).rejects.toMatchObject({
      message: 'GATEWAY_UNAVAILABLE',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})