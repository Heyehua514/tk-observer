// WorkBuddy 分析结果解析契约测试；所属剪辑工作台；仅验证服务端使用的严格数据边界。
const assert = require('node:assert/strict')
const test = require('node:test')

const { parseWorkBuddyAnalysis } = require('../pb_hooks/lib/workbuddy-analysis.js')

const expected = {
  titlePatterns: ['数字开头', '结果前置'],
  publishTimePatterns: ['工作日 20:00'],
  contentTypePreferences: ['案例拆解'],
  summary: '标题强调结果，晚间发布效果较好。',
}

test('parses a direct JSON analysis and returns only the contract fields', () => {
  const raw = JSON.stringify(expected)

  assert.deepEqual(parseWorkBuddyAnalysis(raw), expected)
})

test('extracts the documented CodeBuddy result string wrapper', () => {
  const raw = JSON.stringify({
    type: 'result',
    subtype: 'success',
    result: JSON.stringify(expected),
  })

  assert.deepEqual(parseWorkBuddyAnalysis(raw), expected)
})

test('extracts fenced JSON from the final successful CodeBuddy result event', () => {
  const raw = JSON.stringify([
    { type: 'system', subtype: 'init' },
    { type: 'assistant', content: '分析中' },
    {
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: `已完成分析。\n\`\`\`json\n${JSON.stringify(expected)}\n\`\`\``,
    },
  ])

  assert.deepEqual(parseWorkBuddyAnalysis(raw), expected)
})

test('extracts a structured_output object wrapper', () => {
  const raw = JSON.stringify({ structured_output: expected })

  assert.deepEqual(parseWorkBuddyAnalysis(raw), expected)
})

test('extracts a fenced JSON content wrapper', () => {
  const raw = JSON.stringify({
    content: `\n\`\`\`json\n${JSON.stringify(expected)}\n\`\`\`\n`,
  })

  assert.deepEqual(parseWorkBuddyAnalysis(raw), expected)
})

test('trims strings and drops blank array entries', () => {
  const raw = JSON.stringify({
    titlePatterns: ['  数字开头  ', '', '   '],
    publishTimePatterns: [' 晚间 '],
    contentTypePreferences: [],
    summary: '  有效总结  ',
  })

  assert.deepEqual(parseWorkBuddyAnalysis(raw), {
    titlePatterns: ['数字开头'],
    publishTimePatterns: ['晚间'],
    contentTypePreferences: [],
    summary: '有效总结',
  })
})

test('rejects missing, extra, or incorrectly typed payload fields', () => {
  assert.throws(() =>
    parseWorkBuddyAnalysis(
      JSON.stringify({
        titlePatterns: ['标题'],
        publishTimePatterns: [],
        contentTypePreferences: [],
      }),
    ),
  )
  assert.throws(() =>
    parseWorkBuddyAnalysis(JSON.stringify({ ...expected, confidence: 0.9 })),
  )
  assert.throws(() =>
    parseWorkBuddyAnalysis(
      JSON.stringify({ ...expected, titlePatterns: ['标题', 1] }),
    ),
  )
})

test('rejects a blank summary and malformed JSON', () => {
  assert.throws(() =>
    parseWorkBuddyAnalysis(JSON.stringify({ ...expected, summary: '   ' })),
  )
  assert.throws(() => parseWorkBuddyAnalysis('{not json'))
  assert.throws(() => parseWorkBuddyAnalysis(''))
})

test('does not recursively search undocumented wrapper objects', () => {
  assert.throws(() =>
    parseWorkBuddyAnalysis(JSON.stringify({ data: { result: expected } })),
  )
})

test('rejects CodeBuddy event arrays without a final successful result', () => {
  assert.throws(() =>
    parseWorkBuddyAnalysis(
      JSON.stringify([
        { type: 'result', is_error: false, result: JSON.stringify(expected) },
        { type: 'assistant', content: 'later event' },
      ]),
    ),
  )
  assert.throws(() =>
    parseWorkBuddyAnalysis(
      JSON.stringify([
        { type: 'result', is_error: true, result: JSON.stringify(expected) },
      ]),
    ),
  )
})
