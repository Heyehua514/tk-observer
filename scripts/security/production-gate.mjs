#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const frontendPath = /^(apps\/web\/src|apps\/web\/public)\//u

export function scanProductionText(files) {
  const findings = []
  for (const [file, text] of Object.entries(files)) {
    if (frontendPath.test(file) && /VITE_[A-Z0-9_]*SERVICE_ROLE|service_role/iu.test(text)) {
      findings.push({ file, rule: 'frontend-service-role-key' })
    }
  }
  return { findings }
}

function collectFiles(root) {
  const files = {}
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else if (/\.(?:ts|tsx|js|mjs|json|html|sql|env|md)$/u.test(entry.name)) {
        files[path.relative(root, absolute)] = fs.readFileSync(absolute, 'utf8')
      }
    }
  }
  walk(root)
  return files
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd()
  const result = scanProductionText(collectFiles(root))
  if (result.findings.length) {
    console.error('生产安全门禁失败：发现前端暴露 service role 密钥')
    for (const finding of result.findings) console.error(`${finding.file}: ${finding.rule}`)
    process.exitCode = 1
  } else {
    console.log('生产安全门禁通过：未发现前端 service role 密钥')
  }
}
