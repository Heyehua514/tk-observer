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

const CODEBUDDY =
  process.env.CODEBUDDY_CLI ||
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'
const PORT = Number(process.env.PORT || process.argv[2] === '--port' ? process.argv[3] : 8877)

export function extractAssistantText(result) {
  const messages = Array.isArray(result) ? result : []
  const texts = []
  for (const m of messages) {
    if (m?.type !== 'message' || m?.role !== 'assistant') continue
    for (const c of m.content || []) {
      if (c?.type === 'output_text' && c.text) texts.push(c.text)
    }
  }
  return texts.length ? texts[texts.length - 1] : JSON.stringify(result)
}

function runCli(prompt) {
  return new Promise((resolve, reject) => {
    const child = execFile(
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

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, workbuddy: 'ready' }))
  }

  if (req.method === 'POST' && url.pathname === '/analyze') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body || '{}')
        if (!prompt) throw new Error('EMPTY_PROMPT')
        const result = await runCli(prompt)
        const text = extractAssistantText(result)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, text }))
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: e.message }))
      }
    })
    return
  }

  res.writeHead(404).end()
})

if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`WorkBuddy 网关已启动：http://127.0.0.1:${PORT}`)
  })
}
