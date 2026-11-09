import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_GATEWAY,
  callCloudAiProxy,
  callWorkBuddyGateway,
  getStoredGatewayUrl,
  setStoredGatewayUrl,
} from './workbuddy-gateway'

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ auth: { getSession: mocks.getSession } }),
}))

beforeEach(() => {
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'session-token' } },
    error: null,
  })
})

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
    message: 'AI_CLOUD_UNAVAILABLE',
  })
})

it('aborts a stalled gateway request after the client deadline', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (fetchMock.mock.calls.length > 1) {
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true, text: '云端结果' }), {
          status: 200,
        })
      )
    }
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
  await expect(request).resolves.toBe('云端结果')
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
    localStorage.setItem(
      'sb-test-auth-token',
      JSON.stringify({ access_token: 'stale-token' })
    )
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, text: '云端分析结果' }), {
          status: 200,
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(callWorkBuddyGateway('分析任务')).resolves.toBe('云端分析结果')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain('/functions/v1/ai-proxy')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Bearer session-token',
      }),
    })
  })

  it('reports an expired or missing Supabase session distinctly', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(callWorkBuddyGateway('分析任务')).rejects.toMatchObject({
      message: 'AI_AUTH_REQUIRED',
    })
  })

  it('keeps the stable error when neither channel is available', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(callWorkBuddyGateway('分析任务')).rejects.toMatchObject({
      message: 'AI_CLOUD_UNAVAILABLE',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    [401, 'AUTH_REQUIRED', 'AI_AUTH_REQUIRED'],
    [503, 'AI_NOT_CONFIGURED', 'AI_NOT_CONFIGURED'],
    [502, 'AI_UPSTREAM_FAILED', 'AI_UPSTREAM_FAILED'],
    [400, 'AI_EMPTY_RESPONSE', 'AI_INVALID_RESPONSE'],
    [500, 'INTERNAL_ERROR', 'AI_CLOUD_UNAVAILABLE'],
  ])('maps cloud status %s and %s to %s', async (status, code, expected) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: code }), { status })
        )
    )
    await expect(callCloudAiProxy('分析任务')).rejects.toThrow(expected)
  })

  it.each([null, { ok: true, text: ' ' }, { ok: true, text: 123 }])(
    'rejects malformed cloud output %j',
    async (payload) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 })
          )
      )
      await expect(callCloudAiProxy('分析任务')).rejects.toThrow(
        'AI_INVALID_RESPONSE'
      )
    }
  )

  it('ends a stalled session lookup before sending a cloud request', async () => {
    vi.useFakeTimers()
    mocks.getSession.mockReturnValue(new Promise(() => {}))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const assertion = expect(callCloudAiProxy('分析任务')).rejects.toThrow(
      'AI_TIMEOUT'
    )
    await vi.advanceTimersByTimeAsync(8_000)
    await assertion
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ends a cloud request even when fetch ignores abort', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const assertion = expect(callCloudAiProxy('分析任务')).rejects.toThrow(
      'AI_TIMEOUT'
    )
    await vi.advanceTimersByTimeAsync(125_000)
    await assertion
  })
})
