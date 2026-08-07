/**
 * 用途：验证飞书授权与同步的服务端安全边界、分页编排和失败熔断。
 * 权限：测试只使用内存替身，不读取真实 token、不调用飞书、不修改数据库。
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const sync = require('../pb_hooks/lib/feishu-sync.js')

const plain = (value) => JSON.parse(JSON.stringify(value))

test('paginates, waits 200ms between pages, deduplicates by newest update, and commits each cursor', () => {
  const waits = []
  const cursors = []
  const upserts = []
  const pages = {
    '': {
      items: [
        { source_url: 'https://feishu/doc/a', feishu_updated_at: '2026-08-01T00:00:00Z', raw_content: 'old' },
        { source_url: 'https://feishu/doc/b', feishu_updated_at: '2026-08-02T00:00:00Z', raw_content: 'b' },
      ],
      nextCursor: 'page-2',
    },
    'page-2': {
      items: [
        { source_url: 'https://feishu/doc/a', feishu_updated_at: '2026-08-03T00:00:00Z', raw_content: 'new' },
      ],
      nextCursor: '',
    },
  }

  const result = sync.syncSource({
    initialCursor: '',
    fetchPage: (cursor) => pages[cursor],
    upsert: (items) => upserts.push(...items),
    saveCursor: (cursor) => cursors.push(cursor),
    sleep: (milliseconds) => waits.push(milliseconds),
  })

  assert.deepEqual(waits, [200])
  assert.deepEqual(cursors, ['page-2', ''])
  assert.equal(upserts.length, 2)
  assert.equal(upserts.find((item) => item.source_url.endsWith('/a')).raw_content, 'new')
  assert.deepEqual(plain(result), { pages: 2, synced: 2, cursor: '' })
})

test('does not advance the cursor when persistence fails', () => {
  const cursors = []
  assert.throws(() =>
    sync.syncSource({
      initialCursor: 'start',
      fetchPage: () => ({ items: [{ source_url: 'u', feishu_updated_at: '2026-08-01' }], nextCursor: '' }),
      upsert: () => {
        throw new Error('write failed')
      },
      saveCursor: (cursor) => cursors.push(cursor),
      sleep: () => {},
    }),
  )
  assert.deepEqual(cursors, [])
})

test('retries at most three total attempts with 1s and 2s exponential delays', () => {
  let attempts = 0
  const waits = []
  const value = sync.retry(
    () => {
      attempts += 1
      if (attempts < 3) throw new Error('temporary')
      return 'ok'
    },
    (milliseconds) => waits.push(milliseconds),
  )
  assert.equal(value, 'ok')
  assert.equal(attempts, 3)
  assert.deepEqual(waits, [1000, 2000])

  attempts = 0
  assert.throws(() =>
    sync.retry(() => {
      attempts += 1
      throw new Error('still failing')
    }, () => {}),
  )
  assert.equal(attempts, 3)
})

test('resets failure count after success and disables sync on the fifth consecutive failure', () => {
  const user = { feishu_sync_enabled: true }
  const state = { consecutive_failures: 4 }
  assert.deepEqual(plain(sync.recordSyncFailure(user, state)), {
    consecutiveFailures: 5,
    disabled: true,
  })
  assert.equal(user.feishu_sync_enabled, false)
  assert.equal(state.consecutive_failures, 5)

  user.feishu_sync_enabled = true
  sync.recordSyncSuccess(state)
  assert.equal(state.consecutive_failures, 0)
})

test('authorization route rejects anonymous and cross-user exchange requests', () => {
  const hook = loadAuthHook()
  assert.equal(hook.routes.length, 1)
  const route = hook.routes[0]
  assert.equal(route.method, 'POST')
  assert.equal(route.path, '/api/tk-observer/feishu/exchange-token')

  const anonymous = route.callback(eventFor({ auth: null, body: { code: 'c', userId: 'u1' } }))
  assert.equal(anonymous.status, 401)
  const crossUser = route.callback(eventFor({ auth: { id: 'u1' }, body: { code: 'c', userId: 'u2' } }))
  assert.equal(crossUser.status, 403)
  assert.equal(hook.requests.length, 0)
})

test('authorization route gets app token first and stores only encrypted user tokens', () => {
  const hook = loadAuthHook()
  const event = eventFor({ auth: { id: 'u1' }, body: { code: 'authorization-code', userId: 'u1' } })
  const response = hook.routes[0].callback(event)

  assert.equal(response.status, 200)
  assert.equal(hook.requests.length, 2)
  assert.match(hook.requests[0].url, /auth\/v3\/app_access_token\/internal$/)
  assert.equal(hook.requests[1].headers.Authorization, 'Bearer app-token')
  assert.match(hook.requests[1].url, /authen\/v1\/access_token$/)
  assert.equal(hook.securityCalls.length, 2)
  assert.deepEqual(hook.securityCalls.map((call) => call.value), ['user-token', 'refresh-token'])
  assert.equal(hook.record.fields.feishu_access_token, 'enc:user-token')
  assert.equal(hook.record.fields.feishu_refresh_token, 'enc:refresh-token')
  assert.equal(hook.record.fields.feishu_open_id, 'open-id')
  assert(!JSON.stringify(response.body).includes('user-token'))
})

function eventFor({ auth, body }) {
  return {
    auth,
    requestInfo: () => ({ body }),
    json: (status, responseBody) => ({ status, body: responseBody }),
  }
}

function loadAuthHook() {
  const routes = []
  const requests = []
  const securityCalls = []
  const record = {
    fields: {},
    set(name, value) {
      this.fields[name] = value
    },
  }
  const responses = [
    { statusCode: 200, json: { code: 0, app_access_token: 'app-token' } },
    {
      statusCode: 200,
      json: {
        code: 0,
        data: {
          access_token: 'user-token',
          refresh_token: 'refresh-token',
          expires_in: 7200,
          open_id: 'open-id',
        },
      },
    },
  ]
  const context = {
    onRecordCreate: () => {},
    routerAdd: (method, routePath, callback) => routes.push({ method, path: routePath, callback }),
    $app: {
      findRecordById: (_collection, id) => {
        assert.equal(id, 'u1')
        return record
      },
      save: () => {},
    },
    $os: {
      getenv: (name) => ({
        FEISHU_APP_ID: 'app-id',
        FEISHU_APP_SECRET: 'app-secret',
        FEISHU_TOKEN_ENCRYPTION_KEY: '12345678901234567890123456789012',
      })[name] || '',
    },
    $http: {
      send: (request) => {
        requests.push(request)
        return responses.shift()
      },
    },
    $security: {
      encrypt: (value, key) => {
        securityCalls.push({ value, key })
        return `enc:${value}`
      },
    },
    Date,
    JSON,
    String,
  }
  const hookPath = path.join(root, 'pb_hooks', 'feishu-auth.pb.js')
  vm.runInNewContext(fs.readFileSync(hookPath, 'utf8'), context)
  return { routes, requests, securityCalls, record }
}
