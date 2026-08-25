import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const webRequire = createRequire(
  new URL('../apps/web/package.json', import.meta.url)
)
const viteEntry = webRequire.resolve('vite')
const { loadConfigFromFile } = await import(pathToFileURL(viteEntry).href)
const configPath = fileURLToPath(
  new URL('../apps/web/vite.config.ts', import.meta.url)
)

test('browser tests prebundle dependencies discovered after startup', async () => {
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'test' },
    configPath
  )

  assert.ok(loaded, 'expected Vite to load the web test config')
  assert.ok(
    loaded.config.optimizeDeps?.include?.includes('react-dom/client'),
    'react-dom/client must be prebundled to prevent a mid-run Vite reload'
  )
})
