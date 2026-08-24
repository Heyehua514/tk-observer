import test from 'node:test'
import assert from 'node:assert/strict'
import { scanProductionText } from './production-gate.mjs'

test('flags service role keys exposed to the frontend', () => {
  const result = scanProductionText({
    'apps/web/src/config.ts': 'const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY',
  })
  assert.deepEqual(result.findings, [
    {
      file: 'apps/web/src/config.ts',
      rule: 'frontend-service-role-key',
    },
  ])
})

test('passes clean frontend text and ignores backend-only service role usage', () => {
  const result = scanProductionText({
    'apps/web/src/config.ts': 'const key = import.meta.env.VITE_SUPABASE_ANON_KEY',
    'supabase/functions/sync.ts': 'Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")',
  })
  assert.deepEqual(result.findings, [])
})
