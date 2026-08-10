import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const scriptUrl = new URL('./render-brand-logo.mjs', import.meta.url)

test('logo renderer defines the three canonical 1024px exports', async () => {
  assert.equal(existsSync(scriptUrl), true, 'render-brand-logo.mjs must exist')
  if (!existsSync(scriptUrl)) return

  const { LOGO_EXPORTS } = await import(scriptUrl.href)
  assert.deepEqual(
    LOGO_EXPORTS.map(({ output }) => output),
    [
      'tk-observer-mark-1024.png',
      'tk-observer-mark-symbol-1024.png',
      'tk-observer-mark-mono-1024.png',
    ]
  )
})
