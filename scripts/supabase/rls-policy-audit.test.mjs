import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

test('audits that all latest public table SELECT policies do not gate on deleted_at', () => {
  const dir = path.resolve('supabase/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

  // Track the most recent definition for each table + policy name
  const latestPolicies = new Map()

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8')
    const regex = /create\s+policy\s+"([^"]+)"\s+on\s+public\.([a-zA-Z0-9_]+)\s+for\s+([a-zA-Z]+)([\s\S]*?);/gi
    let match
    while ((match = regex.exec(content)) !== null) {
      const policyName = match[1]
      const table = match[2]
      const cmd = match[3].toUpperCase()
      const rest = match[4].trim()
      const key = `${table}:${policyName}`
      latestPolicies.set(key, { file, table, policyName, cmd, rest })
    }
  }

  // Tables where collaborator soft delete is supported:
  // SELECT policy must be role-scoped and NOT contain `deleted_at` gate
  const softDeleteCollaboratorTables = [
    'product_radars',
    'creator_follow_ups',
    'video_metrics_logs',
    'video_accounts',
    'video_ideas',
    'import_history',
    'intelligence_items',
    'ai_memory',
    'ai_notes',
    'status_history',
    'clients',
    'creators',
    'companies',
    'opportunities',
    'channel_orders',
    'social_plans',
    'publish_schedules',
    'venues',
    'products',
  ]

  const violations = []
  for (const tableName of softDeleteCollaboratorTables) {
    for (const [key, p] of latestPolicies) {
      if (p.table === tableName && p.cmd === 'SELECT') {
        if (p.rest.toLowerCase().includes('deleted_at')) {
          violations.push({
            table: p.table,
            policy: p.policyName,
            file: p.file,
            clause: p.rest.replace(/\s+/g, ' '),
          })
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Found SELECT policies gating on deleted_at which triggers 403 on soft-delete: ${JSON.stringify(violations, null, 2)}`
  )
})
