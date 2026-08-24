import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { readCaptureFile } from './contract.mjs'
import { syncBatch } from './supabase.mjs'

const [, , command, input] = process.argv

async function syncFile(file) {
  const payload = readCaptureFile(JSON.parse(await readFile(file, 'utf8')))
  const result = await syncBatch(payload)
  console.log(JSON.stringify({ ok: true, idempotencyKey: payload.idempotencyKey, ...result }))
}

async function runCollector() {
  const collectorDir = process.env.WECHAT_COLLECTOR_DIR
  const account = process.env.WECHAT_COLLECTOR_ACCOUNT
  const output = process.env.WECHAT_CAPTURE_FILE
  if (!collectorDir || !account || !output) throw new Error('WECHAT_COLLECTOR_DIR, WECHAT_COLLECTOR_ACCOUNT and WECHAT_CAPTURE_FILE are required')
  const child = spawn(process.env.WECHAT_COLLECTOR_NODE || 'node', ['src/index.js', '--account', account], { cwd: collectorDir, stdio: 'inherit', env: process.env })
  await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`collector exited with ${code}`))) })
  await syncFile(output)
}

if (command === 'sync') await syncFile(input)
else if (command === 'run-collector') await runCollector()
else throw new Error('usage: pnpm sync -- <capture.json> or pnpm run-collector')
