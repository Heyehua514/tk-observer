import { mkdir, writeFile } from 'node:fs/promises'
import {
  normalizeCollections,
  validatePocketBaseTestUrl,
} from './schema-inventory.mjs'

const baseUrl = process.env.PB_TEST_BASE_URL
const token = process.env.PB_TEST_SUPERUSER_TOKEN

if (!baseUrl) throw new Error('PB_TEST_BASE_URL is required')
if (!token) throw new Error('PB_TEST_SUPERUSER_TOKEN is required')
if (process.env.PB_TEST_ALLOW_SCHEMA_EXPORT !== '1') {
  throw new Error('PB_TEST_ALLOW_SCHEMA_EXPORT=1 is required')
}

const url = validatePocketBaseTestUrl(baseUrl)
const endpoint = new URL('/api/collections?perPage=500', url)
const response = await fetch(endpoint, {
  headers: { Authorization: token },
})
if (!response.ok) {
  throw new Error(`PocketBase schema request failed: ${response.status}`)
}

const payload = await response.json()
const collections = normalizeCollections(payload.items || [])
const outputDir = '/tmp/tk-observer-supabase'
const outputPath = `${outputDir}/pocketbase-schema.json`
await mkdir(outputDir, { recursive: true })
await writeFile(outputPath, `${JSON.stringify(collections, null, 2)}\n`)

const fieldCount = collections.reduce(
  (sum, item) => sum + item.fields.length,
  0
)
console.log(
  `PocketBase schema: ${collections.length} collections, ${fieldCount} fields`
)
console.log(outputPath)
