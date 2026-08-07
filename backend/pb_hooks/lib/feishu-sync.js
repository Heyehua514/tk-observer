/**
 * 用途：飞书文档分页、去重、限流、重试、游标提交与用户级同步编排。
 * 权限：仅供服务端 cron 调用；调用方必须传入解密后的当前用户 token。
 */
const SOURCE_TYPES = ['doc', 'wiki', 'bitable']
const PAGE_DELAY_MS = 200
const MAX_ATTEMPTS = 3
const DISABLE_AFTER_FAILURES = 5
const USER_TIMEOUT_MS = 300000

function read(target, key) {
  return target && typeof target.get === 'function' ? target.get(key) : target[key]
}

function write(target, key, value) {
  if (target && typeof target.set === 'function') target.set(key, value)
  else target[key] = value
}

function timestamp(value) {
  const source = String(value || '')
  if (/^\d{9,13}$/.test(source)) {
    const numeric = Number(source)
    return numeric < 100000000000 ? numeric * 1000 : numeric
  }
  const parsed = Date.parse(source)
  return Number.isFinite(parsed) ? parsed : 0
}

function deduplicateByUrl(items) {
  const latest = {}
  for (const item of items || []) {
    if (!item || !String(item.source_url || '').trim()) continue
    const url = String(item.source_url).trim()
    const previous = latest[url]
    if (!previous || timestamp(item.feishu_updated_at) >= timestamp(previous.feishu_updated_at)) {
      latest[url] = { ...item, source_url: url }
    }
  }
  return Object.keys(latest).map((url) => latest[url])
}

function retry(operation, sleep) {
  let lastError
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return operation(attempt + 1)
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS - 1) sleep(1000 * 2 ** attempt)
    }
  }
  throw lastError
}

function syncSource(options) {
  const allItems = []
  const committedCursors = []
  let cursor = String(options.initialCursor || '')
  let pages = 0

  while (true) {
    if (options.assertWithinDeadline) options.assertWithinDeadline()
    const page = retry(() => options.fetchPage(cursor), options.sleep)
    if (!page || !Array.isArray(page.items)) throw new Error('Feishu page is invalid')
    allItems.push(...page.items)
    pages += 1
    cursor = String(page.nextCursor || '')
    committedCursors.push(cursor)
    if (!cursor) break
    options.sleep(PAGE_DELAY_MS)
  }

  const uniqueItems = deduplicateByUrl(allItems)
  options.upsert(uniqueItems)
  for (const nextCursor of committedCursors) options.saveCursor(nextCursor)
  return { pages, synced: uniqueItems.length, cursor }
}

function recordSyncFailure(user, state) {
  const consecutiveFailures = Number(read(state, 'consecutive_failures') || 0) + 1
  write(state, 'consecutive_failures', consecutiveFailures)
  const disabled = consecutiveFailures >= DISABLE_AFTER_FAILURES
  if (disabled) write(user, 'feishu_sync_enabled', false)
  return { consecutiveFailures, disabled }
}

function recordSyncSuccess(state) {
  write(state, 'consecutive_failures', 0)
}

function requestJson(http, request) {
  const response = http.send(request)
  const body = response && response.json
  if (!response || response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Feishu request failed (${response ? response.statusCode : 'no response'})`)
  }
  if (!body || (body.code !== undefined && Number(body.code) !== 0)) {
    throw new Error(`Feishu API rejected request (${body && body.code !== undefined ? body.code : 'invalid body'})`)
  }
  return body.data || body
}

function normalizeRemoteItem(item, sourceType) {
  const type = String(item.docs_type || item.doc_type || item.type || sourceType)
  const token = String(item.docs_token || item.doc_token || item.obj_token || item.token || '')
  const url = String(item.url || item.source_url || (token ? `https://open.feishu.cn/${type}/${token}` : ''))
  return {
    source_type: sourceType,
    source_url: url,
    source_title: String(item.title || item.name || ''),
    raw_content: String(item.raw_content || item.content || item.summary || '').slice(0, 50000),
    author_name: String(item.owner_name || item.author_name || ''),
    feishu_updated_at: item.update_time || item.updated_at || item.modified_time || '',
    access_scope: item.access_scope || 'internal',
  }
}

function createPageFetcher(http, accessToken, sourceType) {
  const typeFilters = {
    doc: ['doc', 'docx'],
    wiki: ['wiki'],
    bitable: ['bitable'],
  }
  return (cursor) => {
    const data = requestJson(http, {
      url: 'https://open.feishu.cn/open-apis/suite/docs-api/search/object',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: {
        search_key: '',
        count: 50,
        offset: cursor ? Number(cursor) : 0,
        docs_types: typeFilters[sourceType],
      },
      timeout: 120,
    })
    const rawItems = data.docs_entities || data.items || data.files || []
    const items = rawItems
      .map((item) => normalizeRemoteItem(item, sourceType))
      .filter((item) => item.source_url)
    const hasMore = Boolean(data.has_more)
    const nextCursor = hasMore
      ? String(data.next_cursor || data.page_token || (cursor ? Number(cursor) : 0) + 50)
      : ''
    return { items, nextCursor }
  }
}

function findOrCreateState(app, userId, sourceType) {
  try {
    return app.findFirstRecordByFilter(
      'feishu_sync_state',
      'user = {:user} && source_type = {:sourceType}',
      { user: userId, sourceType },
    )
  } catch (_) {
    const state = new Record(app.findCollectionByNameOrId('feishu_sync_state'))
    state.set('user', userId)
    state.set('source_type', sourceType)
    state.set('last_cursor', '')
    state.set('consecutive_failures', 0)
    app.save(state)
    return state
  }
}

function upsertDocuments(app, userId, sourceType, items, now) {
  const collection = app.findCollectionByNameOrId('feishu_documents')
  for (const item of items) {
    let record
    try {
      record = app.findFirstRecordByFilter(
        'feishu_documents',
        'owner_user = {:owner} && source_url = {:url}',
        { owner: userId, url: item.source_url },
      )
      if (timestamp(record.get('feishu_updated_at')) > timestamp(item.feishu_updated_at)) continue
    } catch (_) {
      record = new Record(collection)
      record.set('owner_user', userId)
      record.set('source_url', item.source_url)
    }
    record.set('source_type', sourceType)
    record.set('source_title', item.source_title)
    record.set('raw_content', item.raw_content)
    record.set('author_name', item.author_name)
    record.set('feishu_updated_at', item.feishu_updated_at || null)
    record.set('access_scope', item.access_scope)
    record.set('sync_status', 'pending')
    record.set('synced_at', now)
    app.save(record)
  }
}

function run(app, http, security, os, requestedSourceTypes) {
  const sourceTypes = requestedSourceTypes || SOURCE_TYPES
  const key = String(os.getenv('FEISHU_TOKEN_ENCRYPTION_KEY') || '')
  if (key.length !== 32) throw new Error('FEISHU_TOKEN_ENCRYPTION_KEY must be 32 characters')
  const users = app.findRecordsByFilter(
    'users',
    'feishu_sync_enabled = true && feishu_access_token != ""',
    '-created',
    500,
  )
  const summary = { users: 0, sources: 0, documents: 0, failures: 0, disabled: 0 }
  const sleep = (milliseconds) => os.cmd('/bin/sleep', String(milliseconds / 1000)).output()

  for (const user of users) {
    const deadline = Date.now() + USER_TIMEOUT_MS
    const accessToken = security.decrypt(String(user.get('feishu_access_token')), key)
    summary.users += 1
    for (const sourceType of sourceTypes) {
      const state = findOrCreateState(app, user.id, sourceType)
      try {
        const now = new Date().toISOString()
        const result = syncSource({
          initialCursor: state.get('last_cursor'),
          fetchPage: createPageFetcher(http, accessToken, sourceType),
          upsert: (items) => upsertDocuments(app, user.id, sourceType, items, now),
          saveCursor: (cursor) => {
            state.set('last_cursor', cursor)
            app.save(state)
          },
          sleep,
          assertWithinDeadline: () => {
            if (Date.now() > deadline) throw new Error('Feishu user sync exceeded 300 seconds')
          },
        })
        recordSyncSuccess(state)
        state.set('last_synced_at', now)
        app.save(state)
        summary.sources += 1
        summary.documents += result.synced
      } catch (error) {
        const failure = recordSyncFailure(user, state)
        app.save(state)
        if (failure.disabled) {
          app.save(user)
          summary.disabled += 1
        }
        summary.failures += 1
        console.log(JSON.stringify({ event: 'feishu_sync_failed', userId: user.id, sourceType, message: String(error) }))
        if (failure.disabled || Date.now() > deadline) break
      }
    }
  }
  return summary
}

module.exports = {
  deduplicateByUrl,
  recordSyncFailure,
  recordSyncSuccess,
  retry,
  run,
  syncSource,
}
