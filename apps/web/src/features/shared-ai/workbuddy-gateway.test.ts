import { expect, it, vi } from 'vitest'
import { callWorkBuddyGateway } from './workbuddy-gateway'

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
