/**
 * 用途：验证知识切片、WorkBuddy 严格结果边界和处理失败语义。
 * 所属工作台：知识库。
 * 权限：仅测试服务端纯函数与编排，不访问真实数据库或 CLI。
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const {
  chunkContent,
  createBatches,
  parseKnowledgeResult,
  processDocument,
} = require('../pb_hooks/lib/knowledge-process.js')

const validResult = {
  summary: '团队确认先完成样片。',
  decisions: ['先完成样片'],
  actionItems: [{ task: '周五前交付样片', owner: '剪辑' }],
  risks: ['素材可能延迟'],
  sops: ['收集素材后制作样片'],
  failedLessons: ['不要跳过素材确认'],
  quoteSnippets: ['先做一个样片'],
  qualityScore: 88,
}

const record = (id, fields) => ({
  id,
  fields: { ...fields },
  get(name) {
    return this.fields[name]
  },
  set(name, value) {
    this.fields[name] = value
  },
})

test('registers a 30-second create trigger and a 22:00 stale-pending sweep', () => {
  const createHooks = []
  const crons = []
  const sleeps = []
  const calls = []
  const hookPath = path.resolve(__dirname, '../pb_hooks/knowledge-process.pb.js')
  const context = {
    __hooks: path.resolve(__dirname, '../pb_hooks'),
    $app: { marker: 'app' },
    $os: { marker: 'os' },
    Date,
    console: { log: () => {} },
    cronAdd: (name, schedule, callback) => crons.push({ name, schedule, callback }),
    onRecordAfterCreateSuccess: (callback, collection) =>
      createHooks.push({ callback, collection }),
    require: () => ({
      processDocument: (...args) => calls.push(['document', ...args]),
      processStalePending: (...args) => calls.push(['stale', ...args]),
    }),
    sleep: (milliseconds) => sleeps.push(milliseconds),
  }

  vm.runInNewContext(fs.readFileSync(hookPath, 'utf8'), context)
  assert.equal(createHooks.length, 1)
  assert.equal(createHooks[0].collection, 'feishu_documents')
  assert.equal(crons.length, 1)
  assert.equal(crons[0].schedule, '0 22 * * *')

  let nextCalls = 0
  createHooks[0].callback({
    record: record('doc', { sync_status: 'pending' }),
    next: () => {
      nextCalls += 1
    },
  })
  assert.deepEqual(sleeps, [30_000])
  assert.equal(calls[0][0], 'document')
  assert.equal(nextCalls, 1)

  crons[0].callback()
  assert.equal(calls[1][0], 'stale')
})

test('splits Unicode content into non-empty chunks of at most 4000 characters', () => {
  const chunks = chunkContent(`${'知'.repeat(3999)}😀${'识'.repeat(4001)}`)

  assert.deepEqual(chunks.map((chunk) => Array.from(chunk).length), [4000, 4000, 1])
  assert.equal(chunks.join(''), `${'知'.repeat(3999)}😀${'识'.repeat(4001)}`)
  assert.deepEqual(chunkContent(''), [])
})

test('creates batches containing at most ten chunks without losing order', () => {
  const input = Array.from({ length: 21 }, (_, index) => `chunk-${index}`)

  assert.deepEqual(createBatches(input).map((batch) => batch.length), [10, 10, 1])
  assert.deepEqual(createBatches(input).flat(), input)
})

test('parses direct and final successful CodeBuddy event results', () => {
  assert.deepEqual(parseKnowledgeResult(JSON.stringify(validResult)), validResult)
  const events = [
    { type: 'assistant', content: 'processing' },
    {
      type: 'result',
      is_error: false,
      result: `\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\``,
    },
  ]

  assert.deepEqual(parseKnowledgeResult(JSON.stringify(events)), validResult)
})

test('normalizes validated text while retaining action item metadata', () => {
  const parsed = parseKnowledgeResult(
    JSON.stringify({
      ...validResult,
      summary: '  有效总结  ',
      decisions: ['  决定  ', '   '],
      actionItems: [{ task: '  跟进合同  ', owner: ' 商务 ' }],
      quoteSnippets: ['  原话  '],
    }),
  )

  assert.equal(parsed.summary, '有效总结')
  assert.deepEqual(parsed.decisions, ['决定'])
  assert.deepEqual(parsed.actionItems, [{ task: '跟进合同', owner: ' 商务 ' }])
  assert.deepEqual(parsed.quoteSnippets, ['原话'])
})

test('rejects empty summary, quote snippets, or action item tasks', () => {
  assert.throws(() =>
    parseKnowledgeResult(JSON.stringify({ ...validResult, summary: '   ' })),
  )
  assert.throws(() =>
    parseKnowledgeResult(JSON.stringify({ ...validResult, quoteSnippets: [] })),
  )
  assert.throws(() =>
    parseKnowledgeResult(
      JSON.stringify({ ...validResult, actionItems: [{ task: ' ' }] }),
    ),
  )
})

test('rejects malicious or ambiguous output instead of searching it recursively', () => {
  const malicious = JSON.stringify({
    ...validResult,
    __proto_payload: { polluted: true },
  })
  assert.throws(() => parseKnowledgeResult(malicious))
  assert.throws(() =>
    parseKnowledgeResult(JSON.stringify({ data: { result: validResult } })),
  )
  assert.throws(() =>
    parseKnowledgeResult(
      JSON.stringify({
        result: JSON.stringify(validResult),
        content: JSON.stringify(validResult),
      }),
    ),
  )
  assert.throws(() =>
    parseKnowledgeResult(
      JSON.stringify({
        result: `\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\`\n\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\``,
      }),
    ),
  )
})

test('processes every chunk with a 120-second guarded CLI and marks the document processed', () => {
  const document = record('doc-1', {
    raw_content: '甲'.repeat(4001),
    sync_status: 'pending',
  })
  const commands = []
  const saved = []
  const collections = {
    knowledge_snippets: { name: 'knowledge_snippets' },
    smart_summaries: { name: 'smart_summaries' },
  }
  const app = {
    findCollectionByNameOrId: (name) => collections[name],
    runInTransaction: (callback) => callback({ save: (item) => saved.push(item) }),
    save: (item) => saved.push(item),
  }
  const os = {
    getenv: () => '/opt/workbuddy/codebuddy',
    cmd: (...args) => {
      commands.push(args)
      return { output: () => JSON.stringify(validResult) }
    },
  }

  const result = processDocument(app, os, document, {
    createRecord: (collection) => record('', { collection: collection.name }),
  })

  assert.deepEqual(result, { chunks: 2, status: 'processed' })
  assert.equal(commands.length, 2)
  assert.deepEqual(commands[0].slice(0, 6), [
    '/usr/bin/perl',
    '-e',
    'alarm shift; exec @ARGV',
    '120',
    '/opt/workbuddy/codebuddy',
    '-p',
  ])
  assert.match(commands[0][6], /不可信数据/)
  assert.match(commands[0][6], /甲{20}/)
  assert.equal(saved.filter((item) => item.fields.collection === 'knowledge_snippets').length, 2)
  assert.equal(saved.filter((item) => item.fields.collection === 'smart_summaries').length, 2)
  assert.equal(document.fields.sync_status, 'processed')
})

test('marks the document failed and writes no snippets when one CLI result is invalid', () => {
  const document = record('doc-2', {
    raw_content: '乙'.repeat(4001),
    sync_status: 'pending',
  })
  let call = 0
  const saved = []
  const app = {
    findCollectionByNameOrId: (name) => ({ name }),
    runInTransaction: () => assert.fail('invalid results must not start writes'),
    save: (item) => saved.push(item),
  }
  const os = {
    getenv: () => '',
    cmd: () => ({
      output: () => (++call === 1 ? JSON.stringify(validResult) : '{bad-json'),
    }),
  }

  const result = processDocument(app, os, document, {
    createRecord: (collection) => record('', { collection: collection.name }),
  })

  assert.equal(result.status, 'failed')
  assert.equal(document.fields.sync_status, 'failed')
  assert.deepEqual(saved, [document])
})
