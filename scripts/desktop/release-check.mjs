#!/usr/bin/env node
import { pathToFileURL } from 'node:url'

const required = [
  'TAURI_UPDATER_ENDPOINT',
  'TAURI_UPDATER_PUBLIC_KEY',
  'TAURI_SIGNING_PRIVATE_KEY',
]

export function validateReleaseEnvironment(environment) {
  const missing = required.filter((name) => !String(environment[name] || '').trim())
  if (missing.length) return { ok: false, missing }
  const invalid = required.slice(0, 2).filter((name) =>
    String(environment[name]).includes('${')
  )
  if (invalid.length) return { ok: false, invalid }
  return { ok: true }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = validateReleaseEnvironment(process.env)
  if (!result.ok) {
    console.error('桌面端发布配置不完整。请在 CI Secrets/Variables 配置 updater 地址、公钥和签名私钥。')
    if (result.missing) console.error(`缺少：${result.missing.join(', ')}`)
    if (result.invalid) console.error(`占位配置：${result.invalid.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log('桌面端发布配置检查通过（密钥内容不会输出）。')
  }
}
