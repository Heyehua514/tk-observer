/**
 * 飞书同步纯逻辑；权限：Edge Function 内部调用；用途：分页、重试、去重和游标幂等。
 */
export const MAX_ATTEMPTS = 3
export const MAX_PAGES = 100

export function timestamp(value) {
  const source = String(value || '')
  if (/^\d{9,13}$/.test(source)) {
    const numeric = Number(source)
    return numeric < 100000000000 ? numeric * 1000 : numeric
  }
  const parsed = Date.parse(source)
  return Number.isFinite(parsed) ? parsed : 0
}

export function deduplicateByUrl(items) {
  const latest = new Map()
  for (const item of items || []) {
    const url = String(item?.source_url || '').trim()
    if (!url) continue
    const previous = latest.get(url)
    if (!previous || timestamp(item.feishu_updated_at) >= timestamp(previous.feishu_updated_at)) {
      latest.set(url, { ...item, source_url: url })
    }
  }
  return [...latest.values()]
}

export async function retry(operation, sleep = async () => {}) {
  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) await sleep(2 ** (attempt - 1) * 1000)
    }
  }
  throw lastError
}

export async function syncSource({
  initialCursor = '',
  fetchPage,
  upsert,
  saveCursor,
  sleep = async () => {},
  maxPages = MAX_PAGES,
}) {
  const items = []
  const cursors = []
  let cursor = String(initialCursor || '')
  let pages = 0
  while (pages < maxPages) {
    const page = await retry(() => fetchPage(cursor), sleep)
    if (!page || !Array.isArray(page.items)) throw new Error('INVALID_FEISHU_PAGE')
    items.push(...page.items)
    pages += 1
    cursor = String(page.nextCursor || '')
    cursors.push(cursor)
    if (!cursor) break
    await sleep(200)
  }
  if (cursor && pages >= maxPages) throw new Error('FEISHU_PAGE_LIMIT')
  const uniqueItems = deduplicateByUrl(items)
  await upsert(uniqueItems)
  for (const nextCursor of cursors) await saveCursor(nextCursor)
  return { pages, synced: uniqueItems.length, cursor }
}

function fromBase64(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export async function decryptToken(value, keyText, cryptoApi = globalThis.crypto) {
  const [ivText, ciphertextText] = String(value || '').split('.')
  if (!ivText || !ciphertextText) throw new Error('INVALID_ENCRYPTED_TOKEN')
  const key = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyText),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  const plaintext = await cryptoApi.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivText) },
    key,
    fromBase64(ciphertextText)
  )
  return new TextDecoder().decode(plaintext)
}

export function nextFailureCount(current) {
  const consecutiveFailures = Number(current || 0) + 1
  return {
    consecutiveFailures,
    disabled: consecutiveFailures >= 5,
  }
}
