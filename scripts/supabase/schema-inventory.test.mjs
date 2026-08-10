import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeCollections,
  validatePocketBaseTestUrl,
} from './schema-inventory.mjs'

test('normalizes collections without mutating source metadata', () => {
  const source = [
    {
      id: 'runtime-id',
      name: 'zeta',
      type: 'base',
      system: false,
      listRule: 'role = "boss"',
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: ['CREATE INDEX z_b', 'CREATE INDEX z_a'],
      fields: [
        { id: 'field-id', name: 'title', type: 'text', required: true, max: 200 },
        { id: 'field-id-2', name: 'active', type: 'bool', required: false },
      ],
    },
    {
      id: 'runtime-id-2',
      name: 'alpha',
      type: 'view',
      system: false,
      fields: [],
      indexes: [],
    },
  ]
  const snapshot = structuredClone(source)
  const result = normalizeCollections(source)

  assert.deepEqual(source, snapshot)
  assert.deepEqual(result.map((item) => item.name), ['alpha', 'zeta'])
  assert.deepEqual(result[1].indexes, ['CREATE INDEX z_a', 'CREATE INDEX z_b'])
  assert.deepEqual(result[1].fields.map((field) => field.name), ['active', 'title'])
  assert.equal('id' in result[1], false)
  assert.equal('id' in result[1].fields[0], false)
})

test('accepts only non-8090 loopback PocketBase test URLs', () => {
  assert.equal(validatePocketBaseTestUrl('http://127.0.0.1:18090').port, '18090')
  assert.throws(() => validatePocketBaseTestUrl('http://127.0.0.1:8090'))
  assert.throws(() => validatePocketBaseTestUrl('https://example.com:18090'))
})
