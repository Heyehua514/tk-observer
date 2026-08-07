/**
 * 用途：任务建议、模板匹配和工作流校验的服务端契约测试。
 * 权限：测试进程只读取纯逻辑模块，不访问或修改 PocketBase 数据。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const {
  detectTimeConflict,
  matchTemplate,
  parseWorkBuddySuggestion,
  suggestWorkflow,
  validateSteps,
} = require('../pb_hooks/lib/task-engine.js')

const validSteps = [
  {
    order: 1,
    title: '写脚本',
    role: 'market',
    dependsOn: [],
    deliverables: ['脚本'],
    estimatedDays: 2,
    acceptanceCriteria: '信息完整',
    reviewerRole: 'boss',
  },
  {
    order: 2,
    title: '剪辑成片',
    role: 'editing',
    dependsOn: [1],
    deliverables: ['成片'],
    estimatedDays: 3,
    acceptanceCriteria: '可发布',
    reviewerRole: 'boss',
  },
]

test('matches a template at the inclusive 50 percent keyword boundary', () => {
  const templates = [
    {
      id: 'video',
      name: '视频制作',
      trigger_keywords: ['视频', '剪辑', '脚本', '发布'],
      steps: validSteps,
    },
    {
      id: 'event',
      name: '市场活动',
      trigger_keywords: ['活动', '场地', '报名'],
      steps: validSteps,
    },
  ]

  assert.equal(matchTemplate('需要制作视频并完成剪辑', templates).id, 'video')
  assert.equal(matchTemplate('只想制作视频', templates), null)
})

test('rejects cycles and missing assignee, deliverables, or reviewer', () => {
  assert.throws(
    () => validateSteps([
      { ...validSteps[0], dependsOn: [2] },
      { ...validSteps[1], dependsOn: [1] },
    ], ['market', 'editing', 'boss']),
    /cycle/i,
  )
  assert.throws(
    () => validateSteps([{ ...validSteps[0], role: '' }], ['market', 'boss']),
    /assignee/i,
  )
  assert.throws(
    () => validateSteps([{ ...validSteps[0], deliverables: [] }], ['market', 'boss']),
    /deliverables/i,
  )
  assert.throws(
    () => validateSteps([{ ...validSteps[0], reviewerRole: '' }], ['market', 'boss']),
    /reviewer/i,
  )
  assert.throws(
    () => validateSteps(validSteps, ['market', 'boss']),
    /participant role/i,
  )
})

test('detects deadline conflicts from the longest dependency path', () => {
  const now = new Date('2026-08-07T00:00:00.000Z')
  const conflict = detectTimeConflict(
    validSteps,
    '2026-08-11T00:00:00.000Z',
    now,
  )
  assert.deepEqual(conflict, {
    conflict: true,
    requiredDays: 5,
    availableDays: 4,
  })
  assert.equal(
    detectTimeConflict(validSteps, '2026-08-12T00:00:00.000Z', now).conflict,
    false,
  )
})

test('strictly parses the WorkBuddy task suggestion contract', () => {
  const suggestion = {
    suggestedSteps: validSteps,
    riskAlerts: ['截止时间较紧'],
  }
  const wrapped = JSON.stringify({ result: JSON.stringify(suggestion) })

  assert.deepEqual(parseWorkBuddySuggestion(wrapped), suggestion)
  assert.throws(() =>
    parseWorkBuddySuggestion(JSON.stringify({ ...suggestion, extra: true })),
  )
  assert.throws(() =>
    parseWorkBuddySuggestion(JSON.stringify({ ...suggestion, riskAlerts: [1] })),
  )
})

test('uses template steps without WorkBuddy and falls back when no template matches', () => {
  let fallbackCalls = 0
  const template = {
    id: 'video',
    name: '视频制作',
    trigger_keywords: ['视频', '剪辑'],
    steps: validSteps,
  }
  const fromTemplate = suggestWorkflow(
    {
      goal: '制作并剪辑视频',
      deadline: '2026-08-20T00:00:00.000Z',
      participantRoles: ['market', 'editing', 'boss'],
      templates: [template],
    },
    {
      now: new Date('2026-08-07T00:00:00.000Z'),
      workbuddy: () => {
        fallbackCalls += 1
        return '{}'
      },
    },
  )
  assert.equal(fromTemplate.matchedTemplate.id, 'video')
  assert.deepEqual(fromTemplate.suggestedSteps, validSteps)
  assert.equal(fallbackCalls, 0)

  const fromFallback = suggestWorkflow(
    {
      goal: '整理内部流程',
      deadline: '2026-08-20T00:00:00.000Z',
      participantRoles: ['market', 'editing', 'boss'],
      templates: [template],
    },
    {
      now: new Date('2026-08-07T00:00:00.000Z'),
      workbuddy: () => JSON.stringify({ suggestedSteps: validSteps, riskAlerts: [] }),
    },
  )
  assert.equal(fromFallback.matchedTemplate, null)
  assert.equal(fromFallback.suggestedSteps.length, 2)
  assert.equal(fallbackCalls, 0)
})

