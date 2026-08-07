/**
 * 剪辑工作台 WorkBuddy 自动分析编排测试。
 * 权限：仅验证服务端 hook 与 superuser 手动端点，不访问真实数据库或 CLI。
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const hookPath = path.join(root, 'pb_hooks', 'auto-analyze.pb.js')
const libPath = path.join(root, 'pb_hooks', 'lib', 'auto-analyze.js')

function loadHook() {
  const cron = []
  const routes = []
  let createHookRegistrations = 0
  let requireCalls = 0
  const context = {
    __hooks: path.join(root, 'pb_hooks'),
    $app: { marker: 'app' },
    $os: { marker: 'os' },
    cronAdd: (name, schedule, callback) =>
      cron.push({ name, schedule, callback }),
    routerAdd: (method, route, callback) =>
      routes.push({ method, route, callback }),
    onRecordAfterCreateSuccess: () => {
      createHookRegistrations += 1
    },
    require: () => {
      requireCalls += 1
      return { run: () => ({ status: 'empty', analyzed: 0 }) }
    },
  }
  vm.runInNewContext(fs.readFileSync(hookPath, 'utf8'), context)
  return { cron, routes, createHookRegistrations, getRequireCalls: () => requireCalls }
}

function loadAutomation({
  records = [],
  output = '',
  parse,
  cliOverride = '',
  lockHeld = false,
  saveErrorAt = -1,
}) {
  const saves = []
  const commands = []
  const queries = []
  const logs = []
  let lockValue = lockHeld
  const app = {
    findRecordsByFilter: (...args) => {
      queries.push(args)
      return records
    },
    store: () => ({
      setFunc: (_key, callback) => {
        lockValue = callback(lockValue)
      },
      remove: () => {
        lockValue = undefined
      },
    }),
    runInTransaction: (callback) => {
      const snapshots = records.map((item) => ({ ...item.fields }))
      const staged = []
      try {
        callback({
          save: (item) => {
            if (staged.length === saveErrorAt) throw new Error('database write failed')
            staged.push(item)
          },
        })
        saves.push(...staged)
      } catch (error) {
        records.forEach((item, index) => {
          item.fields = snapshots[index]
        })
        throw error
      }
    },
  }
  const os = {
    getenv: (name) => (name === 'WORKBUDDY_CLI' ? cliOverride : ''),
    cmd: (...args) => {
      commands.push(args)
      return { output: () => output }
    },
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(libPath, 'utf8'), {
    module,
    exports: module.exports,
    console: { log: (message) => logs.push(String(message)) },
    require: (request) => {
      assert.equal(request, './workbuddy-analysis.js')
      return { parseWorkBuddyAnalysis: parse }
    },
    Date,
    JSON,
  })
  return { automation: module.exports, app, os, saves, commands, queries, logs }
}

function record(fields) {
  return {
    fields: { ...fields },
    get(key) {
      return this.fields[key]
    },
    set(key, value) {
      this.fields[key] = value
    },
  }
}

const plain = (value) => JSON.parse(JSON.stringify(value))

test('registers a five-minute cron and keeps only the superuser manual trigger', () => {
  const hook = loadHook()
  assert.equal(hook.createHookRegistrations, 0)
  assert.equal(hook.cron.length, 1)
  assert.equal(hook.cron[0].name, 'auto-analyze')
  assert.equal(hook.cron[0].schedule, '*/5 * * * *')
  assert.equal(hook.getRequireCalls(), 0, 'helper must be required inside callback')
  hook.cron[0].callback()
  assert.equal(hook.getRequireCalls(), 1)

  assert.equal(hook.routes.length, 1)
  const response = hook.routes[0].callback({
    hasSuperuserAuth: () => false,
    json: (status, body) => ({ status, body }),
  })
  assert.equal(response.status, 403)
})

test('returns empty without invoking WorkBuddy when no records need analysis', () => {
  const setup = loadAutomation({ records: [], parse: () => assert.fail() })
  const result = setup.automation.run(setup.app, setup.os)
  assert.deepEqual(plain(result), { analyzed: 0, status: 'empty' })
  assert.equal(setup.commands.length, 0)
  assert.equal(setup.saves.length, 0)
  assert.equal(setup.queries[0][0], 'video_ideas')
  assert.equal(setup.queries[0][1], 'ai_analysis = ""')
  assert.equal(setup.queries[0][3], 50)
  assert.match(setup.logs[0], /empty/)
})

test('skips a concurrent cron or manual batch without querying or spending credits', () => {
  const setup = loadAutomation({
    records: [record({ title: 'A' })],
    lockHeld: true,
    parse: () => assert.fail(),
  })

  const result = setup.automation.run(setup.app, setup.os)

  assert.deepEqual(plain(result), { analyzed: 0, status: 'in_progress' })
  assert.equal(setup.queries.length, 0)
  assert.equal(setup.commands.length, 0)
  assert.match(setup.logs[0], /in_progress/)
})

test('parses complete WorkBuddy output before saving every record with one timestamp', () => {
  const records = [
    record({ title: 'A', account: '甲', video_type: 'talk', publish_date: '2026-08-01' }),
    record({ title: 'B', account: '乙', video_type: 'review', publish_date: '2026-08-02' }),
  ]
  const parsed = {
    titlePatterns: ['数字标题'],
    publishTimePatterns: ['晚间'],
    contentTypePreferences: ['口播'],
    summary: '测试结论',
  }
  let parsedRaw = ''
  const setup = loadAutomation({
    records,
    output: '{"result":"raw"}',
    cliOverride: '/opt/workbuddy/codebuddy',
    parse: (raw) => {
      parsedRaw = raw
      return parsed
    },
  })

  const result = setup.automation.run(setup.app, setup.os)

  assert.deepEqual(plain(result), { analyzed: 2, status: 'completed' })
  assert.equal(parsedRaw, '{"result":"raw"}')
  assert.equal(setup.saves.length, 2)
  assert.equal(records[0].fields.ai_analysis, JSON.stringify(parsed))
  assert.equal(records[1].fields.ai_analysis, JSON.stringify(parsed))
  assert.deepEqual(Object.keys(JSON.parse(records[0].fields.ai_analysis)), [
    'titlePatterns',
    'publishTimePatterns',
    'contentTypePreferences',
    'summary',
  ])
  assert.equal(records[0].fields.analyzed_at, records[1].fields.analyzed_at)
  assert.match(records[0].fields.analyzed_at, /^\d{4}-\d{2}-\d{2}T/)
  assert.match(setup.logs[0], /completed/)

  const args = setup.commands[0]
  assert.deepEqual(plain(args.slice(0, 6)), [
    '/usr/bin/perl',
    '-e',
    'alarm shift; exec @ARGV',
    '120',
    '/opt/workbuddy/codebuddy',
    '-p',
  ])
  assert.equal(typeof args[6], 'string')
  assert.deepEqual(plain(args.slice(7)), [
    '--output-format',
    'json',
    '--tools',
    '',
    '--permission-mode',
    'dontAsk',
    '--max-turns',
    '1',
    '--no-session-persistence',
  ])
  assert(!args.includes('--json-schema'))
})

test('uses the packaged WorkBuddy CLI path by default', () => {
  const setup = loadAutomation({
    records: [record({ title: 'A' })],
    output: '{}',
    parse: () => ({ summary: 'ok' }),
  })
  setup.automation.run(setup.app, setup.os)
  assert.equal(
    setup.commands[0][4],
    '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'
  )
})

test('decodes PocketBase command output bytes as UTF-8 before parsing', () => {
  const analysis = {
    titlePatterns: ['结果前置'],
    publishTimePatterns: ['晚间'],
    contentTypePreferences: ['案例拆解'],
    summary: '中文结论',
  }
  let parsedRaw = ''
  const setup = loadAutomation({
    records: [record({ title: 'A' })],
    output: new TextEncoder().encode(JSON.stringify(analysis)),
    parse: (raw) => {
      parsedRaw = raw
      return analysis
    },
  })

  const result = setup.automation.run(setup.app, setup.os)

  assert.deepEqual(plain(result), { analyzed: 1, status: 'completed' })
  assert.equal(parsedRaw, JSON.stringify(analysis))
})

test('rejects malformed UTF-8 command output before parsing or saving', () => {
  const invalidOutputs = [
    Uint8Array.from([0xc0, 0xaf]),
    Uint8Array.from([0xe2, 0x28, 0xa1]),
    Uint8Array.from([0xf0, 0x9f]),
    Uint8Array.from([0xed, 0xa0, 0x80]),
    Uint8Array.from([0xf4, 0x90, 0x80, 0x80]),
  ]

  for (const output of invalidOutputs) {
    const setup = loadAutomation({
      records: [record({ title: 'A' })],
      output,
      parse: () => assert.fail('malformed UTF-8 must not reach JSON parsing'),
    })
    const result = setup.automation.run(setup.app, setup.os)
    assert.equal(result.status, 'workbuddy_unavailable')
    assert.equal(setup.saves.length, 0)
  }
})

test('does not save partial results when WorkBuddy output cannot be parsed', () => {
  const setup = loadAutomation({
    records: [record({ title: 'A' }), record({ title: 'B' })],
    output: 'invalid',
    parse: () => {
      throw new Error('invalid WorkBuddy output')
    },
  })
  const result = setup.automation.run(setup.app, setup.os)
  assert.deepEqual(plain(result), {
    analyzed: 0,
    pending: 2,
    status: 'workbuddy_unavailable',
  })
  assert.equal(setup.saves.length, 0)
  assert.match(setup.logs[0], /workbuddy_unavailable/)
  assert.match(setup.logs[0], /invalid WorkBuddy output/)
})

test('rolls back the whole batch and reports write_failed when a save fails', () => {
  const records = [record({ title: 'A' }), record({ title: 'B' })]
  const setup = loadAutomation({
    records,
    output: '{}',
    saveErrorAt: 1,
    parse: () => ({
      titlePatterns: ['数字标题'],
      publishTimePatterns: ['晚间'],
      contentTypePreferences: ['口播'],
      summary: '测试结论',
    }),
  })

  const result = setup.automation.run(setup.app, setup.os)

  assert.deepEqual(plain(result), {
    analyzed: 0,
    pending: 2,
    status: 'write_failed',
  })
  assert.equal(setup.saves.length, 0)
  assert.equal(records[0].fields.ai_analysis, undefined)
  assert.equal(records[1].fields.ai_analysis, undefined)
  assert.match(setup.logs[0], /write_failed/)
})
