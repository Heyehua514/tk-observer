#!/usr/bin/env node
/**
 * WorkBuddy 本地网关
 * 用途：让部署到公网的 Web 工作台能安全调用本机 WorkBuddy(CodeBuddy) CLI 做 AI 分析。
 * 架构：本网关只在你这台 mac 上运行，监听局域网/本地端口；
 *       前端「开始分析」请求 /analyze，网关执行 codebuddy CLI 并返回结构化结果。
 * 安全：默认仅绑定 127.0.0.1；生产若要跨机调用需先确认授权与加密传输。
 * 用法：node scripts/workbuddy-gateway/server.mjs [--port 8877]
 */
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'

const MAX_REQUEST_BYTES = 1024 * 1024

const CODEBUDDY =
  process.env.CODEBUDDY_CLI ||
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'

export function resolvePort(envPort, argv) {
  return Number(envPort || (argv[2] === '--port' ? argv[3] : 8877))
}

const PORT = resolvePort(process.env.PORT, process.argv)

export function isAllowedOrigin(origin) {
  if (
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    origin === 'tauri://localhost' ||
    origin === 'http://tauri.localhost'
  ) {
    return true
  }
  try {
    const url = new URL(origin)
    return (
      url.protocol === 'https:' &&
      !url.port &&
      url.pathname === '/' &&
      (url.hostname === 'tk-observer.pages.dev' ||
        url.hostname.endsWith('.tk-observer.pages.dev'))
    )
  } catch {
    return false
  }
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin',
  }
}

export function extractAssistantText(result) {
  const messages = Array.isArray(result) ? result : []
  const texts = []
  for (const m of messages) {
    if (m?.type !== 'message' || m?.role !== 'assistant') continue
    for (const c of m.content || []) {
      if (c?.type === 'output_text' && c.text) texts.push(c.text)
    }
  }
  if (!texts.length) throw new Error('INVALID_OUTPUT')
  return texts[texts.length - 1]
}

function runCli(prompt) {
  return new Promise((resolve, reject) => {
    execFile(
      CODEBUDDY,
      ['-p', prompt, '--output-format', 'json'],
      { timeout: 120000, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err)
        resolve(JSON.parse(stdout))
      }
    )
  })
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

export function createGatewayServer({ runCliImpl = runCli } = {}) {
  let busy = false

  return createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const origin = req.headers.origin
    const allowedOrigin = typeof origin === 'string' && isAllowedOrigin(origin)
    if (allowedOrigin) {
      for (const [name, value] of Object.entries(corsHeaders(origin))) {
        res.setHeader(name, value)
      }
    }
    if (req.method === 'OPTIONS') {
      if (!allowedOrigin) {
        return sendJson(res, 403, { ok: false, error: 'FORBIDDEN_ORIGIN' })
      }
      return res.writeHead(204).end()
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, workbuddy: 'ready' })
    }

    if (req.method === 'POST' && url.pathname === '/analyze') {
      if (!allowedOrigin) {
        return sendJson(res, 403, { ok: false, error: 'FORBIDDEN_ORIGIN' })
      }
      if (busy) {
        return sendJson(res, 429, { ok: false, error: 'GATEWAY_BUSY' })
      }

      const declaredLength = Number(req.headers['content-length'] || 0)
      if (declaredLength > MAX_REQUEST_BYTES) {
        req.resume()
        return sendJson(res, 413, { ok: false, error: 'REQUEST_TOO_LARGE' })
      }

      const chunks = []
      let bodyBytes = 0
      let rejected = false
      req.on('data', (chunk) => {
        if (rejected) return
        bodyBytes += chunk.length
        if (bodyBytes > MAX_REQUEST_BYTES) {
          rejected = true
          chunks.length = 0
          sendJson(res, 413, { ok: false, error: 'REQUEST_TOO_LARGE' })
          return
        }
        chunks.push(chunk)
      })
      req.on('end', async () => {
        if (rejected) return
        let prompt
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : ''
        } catch {
          return sendJson(res, 400, { ok: false, error: 'INVALID_REQUEST' })
        }
        if (!prompt) {
          return sendJson(res, 400, { ok: false, error: 'EMPTY_PROMPT' })
        }
        if (busy) {
          return sendJson(res, 429, { ok: false, error: 'GATEWAY_BUSY' })
        }

        busy = true
        try {
          const result = await runCliImpl(prompt)
          const text = extractAssistantText(result)
          sendJson(res, 200, { ok: true, text })
        } catch (error) {
          const code = error instanceof Error && error.message === 'INVALID_OUTPUT'
            ? 'INVALID_OUTPUT'
            : 'WORKBUDDY_FAILED'
          sendJson(res, 502, { ok: false, error: code })
        } finally {
          busy = false
        }
      })
      return
    }

    res.writeHead(404).end()
  })
}

if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  const server = createGatewayServer()
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`WorkBuddy 网关已启动：http://127.0.0.1:${PORT}`)
  })
}
