import { test } from 'node:test'
import assert from 'node:assert'
import { once } from 'node:events'
import {
  corsHeaders,
  createGatewayServer,
  extractAssistantText,
  isAllowedOrigin,
  resolvePort,
} from './server.mjs'

const ORIGIN = 'https://tk-observer.pages.dev'

async function withGateway(runCliImpl, action) {
  const server = createGatewayServer({ runCliImpl })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try {
    await action(`http://127.0.0.1:${address.port}`)
  } finally {
    server.close()
    server.closeAllConnections()
    await once(server, 'close')
  }
}

function analyze(baseUrl, prompt) {
  return fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify({ prompt }),
  })
}

test('extractAssistantText 取最后一段 assistant 文本', () => {
  const result = [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] },
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: '```json\n{"ok":true}\n```' }],
    },
  ]
  assert.equal(extractAssistantText(result), '```json\n{"ok":true}\n```')
})

test('无 assistant 输出时拒绝返回原始 CLI JSON', () => {
  const result = [{ type: 'message', role: 'user', content: [] }]
  assert.throws(() => extractAssistantText(result), {
    message: 'INVALID_OUTPUT',
  })
})

test('只允许 TK观察页面调用旧网关', () => {
  assert.equal(isAllowedOrigin('https://tk-observer.pages.dev'), true)
  assert.equal(isAllowedOrigin('https://abc.tk-observer.pages.dev'), true)
  assert.equal(isAllowedOrigin('http://localhost:5173'), true)
  assert.equal(isAllowedOrigin('https://example.com'), false)
  assert.equal(isAllowedOrigin('https://tk-observer.pages.dev.example.com'), false)
})

test('旧网关预检包含本地网络许可', () => {
  assert.deepEqual(corsHeaders('https://tk-observer.pages.dev'), {
    'Access-Control-Allow-Origin': 'https://tk-observer.pages.dev',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin',
  })
})

test('环境变量端口优先于命令行且命令行端口可单独生效', () => {
  assert.equal(resolvePort('8878', ['node', 'server.mjs', '--port', '8879']), 8878)
  assert.equal(resolvePort(undefined, ['node', 'server.mjs', '--port', '8879']), 8879)
  assert.equal(resolvePort(undefined, ['node', 'server.mjs']), 8877)
})

test('旧网关在读取超限请求体前返回 413 且不调用 CLI', async () => {
  let cliCalls = 0
  await withGateway(
    async () => {
      cliCalls += 1
      return []
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, 'x'.repeat(1024 * 1024))
      assert.equal(response.status, 413)
      assert.deepEqual(await response.json(), {
        ok: false,
        error: 'REQUEST_TOO_LARGE',
      })
    }
  )
  assert.equal(cliCalls, 0)
})

test('旧网关只执行一个 CLI，忙时返回 429', async () => {
  let signalStarted
  const started = new Promise((resolve) => {
    signalStarted = resolve
  })
  let releaseFirst
  const release = new Promise((resolve) => {
    releaseFirst = resolve
  })

  await withGateway(
    async () => {
      signalStarted()
      await release
      return [
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: '完成' }],
        },
      ]
    },
    async (baseUrl) => {
      const first = analyze(baseUrl, '第一个任务')
      await started
      const busy = await analyze(baseUrl, '第二个任务')
      assert.equal(busy.status, 429)
      assert.deepEqual(await busy.json(), {
        ok: false,
        error: 'GATEWAY_BUSY',
      })

      releaseFirst()
      assert.equal((await first).status, 200)
    }
  )
})

test('旧网关不把无效 CLI 输出暴露给浏览器', async () => {
  await withGateway(
    async () => [{ type: 'message', role: 'user', content: [{ secret: 'local-data' }] }],
    async (baseUrl) => {
      const response = await analyze(baseUrl, '分析任务')
      assert.equal(response.status, 502)
      const body = await response.text()
      assert.deepEqual(JSON.parse(body), { ok: false, error: 'INVALID_OUTPUT' })
      assert.doesNotMatch(body, /local-data/)
    }
  )
})
