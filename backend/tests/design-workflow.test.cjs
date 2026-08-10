/** 设计需求、参考与交付 migration 契约测试。 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const migrationPath = path.resolve(
  __dirname,
  '../pb_migrations/1786105000_create_design_workflow.js',
)

test('creates requirements, references, and deliverables with required fields', () => {
  const source = fs.readFileSync(migrationPath, 'utf8')
  for (const collection of [
    'design_requirements',
    'design_references',
    'design_deliverables',
  ]) assert.match(source, new RegExp(`name: ['"]${collection}['"]`))
  for (const field of [
    'requester',
    'target_size',
    'usage_scene',
    'copy_content',
    'delivery_format',
    'reference_urls',
    'priority',
    'checklist_ok',
  ]) assert.match(source, new RegExp(`['"]${field}['"]`))
})

test('separates requester, designer, and read-only delivery permissions', () => {
  const source = fs.readFileSync(migrationPath, 'utf8')
  assert.match(source, /business/)
  assert.match(source, /design/)
  assert.match(source, /boss/)
  assert.match(source, /@request\.body\.status/)
})
