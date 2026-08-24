import { spawn } from 'node:child_process'

const accounts = JSON.parse(process.env.WECHAT_COLLECTOR_ACCOUNTS || '[]')
if (!Array.isArray(accounts) || accounts.length === 0) throw new Error('WECHAT_COLLECTOR_ACCOUNTS must be a non-empty JSON array')

function run(account) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.WECHAT_COLLECTOR_NODE || 'node', ['src/index.js', '--account', account.key], {
      cwd: process.env.WECHAT_COLLECTOR_DIR,
      stdio: 'inherit',
      env: { ...process.env, WECHAT_COLLECTOR_ACCOUNT: account.key, WECHAT_CAPTURE_FILE: account.output },
    })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${account.key} collector exited with ${code}`)))
  })
}

async function runAll() {
  for (const account of accounts) await run(account)
}

const now = new Date()
const next = new Date(now)
next.setHours(Number(process.env.WECHAT_SYNC_HOUR || 2), Number(process.env.WECHAT_SYNC_MINUTE || 0), 0, 0)
if (next <= now) next.setDate(next.getDate() + 1)
const delay = next.getTime() - now.getTime()
console.log(`微信视频号同步已排程: ${next.toISOString()}，账号 ${accounts.length} 个`)
setTimeout(async () => {
  try { await runAll(); console.log('微信视频号同步完成') }
  catch (error) { console.error(`微信视频号同步失败: ${error.message}`); process.exitCode = 1 }
}, delay)
