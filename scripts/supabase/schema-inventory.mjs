const collectionKeys = [
  'name',
  'type',
  'system',
  'listRule',
  'viewRule',
  'createRule',
  'updateRule',
  'deleteRule',
]

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'id' && key !== 'collectionId')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortObject(item)])
  )
}

export function normalizeCollections(collections) {
  return collections
    .map((collection) => ({
      ...Object.fromEntries(
        collectionKeys
          .filter((key) => key in collection)
          .map((key) => [key, collection[key]])
      ),
      indexes: [...(collection.indexes || [])].sort(),
      fields: (collection.fields || [])
        .map(sortObject)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function validatePocketBaseTestUrl(value) {
  const url = new URL(value)
  if (!['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
    throw new Error('PocketBase schema export requires a loopback host')
  }
  if (url.port === '8090') {
    throw new Error('Refusing to inspect the development PocketBase port 8090')
  }
  return url
}
