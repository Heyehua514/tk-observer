/**
 * 团队记忆自动化集成自检；仅允许对显式指定的非 8090 临时 PocketBase 执行。
 * 权限：测试使用本地种子账号和临时 superuser，不应连接生产或真实开发数据。
 */
import assert from 'node:assert/strict'

const baseUrl = process.env.PB_TEST_BASE_URL
const superuserEmail = process.env.PB_TEST_SUPERUSER_EMAIL
const superuserPassword = process.env.PB_TEST_SUPERUSER_PASSWORD

assert(baseUrl, 'PB_TEST_BASE_URL is required')
const testUrl = new URL(baseUrl)
assert(
  ['127.0.0.1', 'localhost', '::1'].includes(testUrl.hostname),
  'PB_TEST_BASE_URL must use a loopback host'
)
assert(testUrl.port !== '8090', 'Refusing to test against port 8090')
assert.equal(
  process.env.PB_TEST_ALLOW_MUTATIONS,
  '1',
  'PB_TEST_ALLOW_MUTATIONS=1 is required'
)
assert(superuserEmail, 'PB_TEST_SUPERUSER_EMAIL is required')
assert(superuserPassword, 'PB_TEST_SUPERUSER_PASSWORD is required')

const jsonRequest = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: options.token } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${JSON.stringify(body)}`)
  }
  return body
}

const expectRejected = async (path, options, expectedStatus) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: options.token,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  assert.equal(response.status, expectedStatus, `${path} must be rejected`)
}

const authenticate = async (collection, identity, password) => {
  const response = await jsonRequest(
    `/api/collections/${collection}/auth-with-password`,
    { method: 'POST', body: { identity, password } }
  )
  return { token: response.token, record: response.record }
}

const create = (collection, token, body) =>
  jsonRequest(`/api/collections/${collection}/records`, {
    method: 'POST',
    token,
    body,
  })

const update = (collection, id, token, body) =>
  jsonRequest(`/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    token,
    body,
  })

const list = (collection, token, filter = '') => {
  const query = new URLSearchParams({ perPage: '200' })
  if (filter) query.set('filter', filter)
  return jsonRequest(`/api/collections/${collection}/records?${query}`, {
    token,
  })
}

const invoke = (name, token) =>
  jsonRequest(`/api/tk-observer/automation/${name}`, {
    method: 'POST',
    token,
  })

const invokeAutoAnalyze = async (token) => {
  let result
  for (let attempt = 0; attempt <= 125; attempt += 1) {
    result = await invoke('auto-analyze', token)
    if (result.status !== 'in_progress') return result
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return result
}

const dateOnly = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
const utcDate = (key) => `${key} 00:00:00.000Z`
const now = new Date()
const today = dateOnly(now)
const yesterday = dateOnly(new Date(now.getTime() - 24 * 60 * 60 * 1000))
const stamp = `${Date.now()}`

const superuser = await authenticate(
  '_superusers',
  superuserEmail,
  superuserPassword
)
const testPassword = 'TeamMemoryRoleTest2026!'
const createRoleUser = async (role, name) => {
  const email = `team-memory-${role}-${stamp}@local.dev`
  await create('users', superuser.token, {
    email,
    password: testPassword,
    passwordConfirm: testPassword,
    name: `${name}-${stamp}`,
    role,
    verified: true,
  })
  return authenticate('users', email, testPassword)
}
const boss = await createRoleUser('boss', '测试磊哥')
const business = await createRoleUser('business', '测试雨辰')
const market = await createRoleUser('market', '测试素云')
const editing = await createRoleUser('editing', '测试谢洁')

await expectRejected(
  '/api/tk-observer/automation/daily-report',
  { token: boss.token },
  403
)
await expectRejected(
  '/api/collections/notifications/records',
  {
    token: editing.token,
    body: {
      recipient: boss.record.id,
      type: 'deadline',
      title: '伪造提醒',
      content: '不应写入',
    },
  },
  400
)
await expectRejected(
  '/api/collections/audit_logs/records',
  {
    token: editing.token,
    body: {
      actor_name: '伪造系统',
      action: 'daily-report',
      entity_type: 'cron_run',
      entity_id: stamp,
    },
  },
  400
)
await expectRejected(
  '/api/collections/video_ideas/records',
  {
    token: editing.token,
    body: {
      account: '跨境TK磊哥',
      video_type: '口播',
      title: `伪造分析-${stamp}`,
      publish_date: utcDate(today),
      ai_analysis: '客户端伪造结论',
      analyzed_at: new Date().toISOString(),
    },
  },
  400
)
for (const [collection, body] of [
  [
    'daily_reports',
    {
      date: utcDate(today),
      stats_json: '{}',
      highlights: '伪造日报',
      generated_at: new Date().toISOString(),
    },
  ],
  [
    'weekly_reports',
    {
      week_start: utcDate(today),
      comparison_json: '{}',
      trends: '伪造周报',
      generated_at: new Date().toISOString(),
    },
  ],
  [
    'failed_cases',
    {
      source_type: 'opportunity',
      source_id: stamp,
      reason: '伪造失败案例',
      recorded_at: new Date().toISOString(),
    },
  ],
]) {
  await expectRejected(
    `/api/collections/${collection}/records`,
    { token: boss.token, body },
    403
  )
}

const client = await create('clients', business.token, {
  name: `自动化测试客户-${stamp}`,
  industry: 'brand',
  source: 'outbound',
  level: 'B',
})
const opportunity = await create('opportunities', business.token, {
  client: client.id,
  title: `自动化测试商机-${stamp}`,
  type: 'other',
  amount: 123400,
  stage: 'contact',
  expected_close: utcDate(today),
  probability: 10,
})
assert.equal(opportunity.created_by, business.record.id)

const event = await create('events', market.token, {
  name: `自动化测试活动-${stamp}`,
  type: 'closed_salon',
  start_date: utcDate(today),
  location_city: '深圳',
  status: 'preparing',
  created_by: market.record.id,
})
const phases = await list(
  'event_phases',
  market.token,
  `event = "${event.id}"`
)
assert(phases.items.length > 0, 'event phase template was not created')
const task = await create('event_tasks', market.token, {
  event: event.id,
  phase: phases.items[0].id,
  title: `自动化测试任务-${stamp}`,
  assignee_role: 'market',
  assignee: market.record.id,
  status: 'todo',
  priority: 'high',
  due_date: utcDate(today),
})

const videoIdea = await create('video_ideas', editing.token, {
  account: '跨境TK磊哥',
  video_type: '口播',
  title: `自动化测试选题-${stamp}`,
  publish_date: utcDate(today),
})
assert.equal(videoIdea.ai_analysis, '')
assert.equal(videoIdea.analyzed_at, '')
const pendingBeforeAnalyze = await list(
  'video_ideas',
  editing.token,
  'ai_analysis = ""'
)

const deadline = await invoke('deadline-check', superuser.token)
assert(deadline.taskCount >= 1)
assert(deadline.opportunityCount >= 1)
const repeatedDeadline = await invoke('deadline-check', superuser.token)
assert.equal(repeatedDeadline.taskCount, 0)
assert.equal(repeatedDeadline.opportunityCount, 0)

await update('opportunities', opportunity.id, business.token, {
  stage: 'lost',
  lost_reason: `预算暂停-${stamp}`,
})
await update('event_tasks', task.id, market.token, {
  due_date: utcDate(yesterday),
})

const wonOpportunity = await create('opportunities', business.token, {
  client: client.id,
  title: `自动化成交商机-${stamp}`,
  type: 'other',
  amount: 55500,
  stage: 'contact',
  probability: 10,
})
await update('opportunities', wonOpportunity.id, business.token, {
  stage: 'won',
})
const completedTask = await create('event_tasks', market.token, {
  event: event.id,
  phase: phases.items[0].id,
  title: `自动化完成任务-${stamp}`,
  assignee_role: 'market',
  assignee: market.record.id,
  status: 'todo',
  priority: 'medium',
  due_date: utcDate(today),
})
await update('event_tasks', completedTask.id, market.token, { status: 'done' })

const daily = await invoke('daily-report', superuser.token)
const weekly = await invoke('weekly-report', superuser.token)
const autoAnalyze = await invokeAutoAnalyze(superuser.token)
const autoAnalyzeStatuses = ['completed', 'empty', 'workbuddy_unavailable']
assert(
  autoAnalyzeStatuses.includes(autoAnalyze.status),
  `unexpected auto-analyze status: ${autoAnalyze.status}`
)
assert(daily.stats.completedEventTasks >= 1)
assert(weekly.comparison.current.wonOpportunities >= 1)
assert(weekly.comparison.current.wonAmount >= 55500)
const repeatedDaily = await invoke('daily-report', superuser.token)
const repeatedWeekly = await invoke('weekly-report', superuser.token)
assert.equal(repeatedDaily.reportId, daily.reportId)
assert.equal(repeatedWeekly.reportId, weekly.reportId)

await update('opportunities', opportunity.id, business.token, {
  stage: 'contact',
})
await update('opportunities', opportunity.id, business.token, {
  stage: 'lost',
  lost_reason: `第二次流失-${stamp}`,
})

const dailyReports = await list('daily_reports', boss.token)
const weeklyReports = await list('weekly_reports', boss.token)
const failedCases = await list('failed_cases', boss.token)
const cronRuns = await list(
  'audit_logs',
  boss.token,
  'entity_type = "cron_run"'
)
const marketNotifications = await list('notifications', market.token)
const businessNotifications = await list('notifications', business.token)
for (const collection of ['daily_reports', 'weekly_reports', 'failed_cases']) {
  const hidden = await list(collection, editing.token)
  assert.equal(hidden.items.length, 0, `${collection} must be boss-only`)
}

assert(dailyReports.items.some((record) => record.id === daily.reportId))
assert(weeklyReports.items.some((record) => record.id === weekly.reportId))
assert(
  failedCases.items.some(
    (record) =>
      record.source_type === 'opportunity' && record.source_id === opportunity.id
  )
)
assert.equal(
  failedCases.items.filter(
    (record) =>
      record.source_type === 'opportunity' && record.source_id === opportunity.id
  ).length,
  1
)
assert(
  failedCases.items.some(
    (record) => record.source_type === 'event_task' && record.source_id === task.id
  )
)
assert(
  marketNotifications.items.some(
    (record) => record.type === 'deadline' && record.recipient === market.record.id
  )
)
assert(
  businessNotifications.items.some(
    (record) =>
      record.type === 'deadline' && record.recipient === business.record.id
  )
)
for (const action of ['deadline-check', 'daily-report', 'weekly-report']) {
  assert(
    cronRuns.items.some((record) => record.action === action),
    `missing cron audit: ${action}`
  )
}

const readVideoIdea = async () => {
  const ideas = await list(
    'video_ideas',
    editing.token,
    `id = "${videoIdea.id}"`
  )
  assert.equal(ideas.items.length, 1, 'created video idea must remain readable')
  return ideas.items[0]
}

const assertStructuredAnalysis = (record) => {
  const analysis = JSON.parse(record.ai_analysis)
  assert.deepEqual(Object.keys(analysis).sort(), [
    'contentTypePreferences',
    'publishTimePatterns',
    'summary',
    'titlePatterns',
  ])
  for (const field of [
    'titlePatterns',
    'publishTimePatterns',
    'contentTypePreferences',
  ]) {
    assert(Array.isArray(analysis[field]), `${field} must be an array`)
    assert(
      analysis[field].every((item) => typeof item === 'string'),
      `${field} must contain only strings`
    )
  }
  assert.equal(typeof analysis.summary, 'string')
  assert(analysis.summary.trim(), 'summary must not be blank')
  assert(String(record.analyzed_at).trim(), 'analyzed_at must not be blank')
  assert(
    !Number.isNaN(new Date(record.analyzed_at).getTime()),
    'analyzed_at must be a valid date'
  )
}

if (autoAnalyze.status === 'workbuddy_unavailable') {
  const record = await readVideoIdea()
  assert.equal(record.ai_analysis, '')
  assert.equal(record.analyzed_at, '')
} else {
  const record = await readVideoIdea()
  assertStructuredAnalysis(record)

  if (autoAnalyze.status === 'completed') {
    let followUp
    const maxFollowUps = Math.ceil(pendingBeforeAnalyze.totalItems / 50) + 1
    for (let attempt = 0; attempt < maxFollowUps; attempt += 1) {
      followUp = await invokeAutoAnalyze(superuser.token)
      assert(
        autoAnalyzeStatuses.includes(followUp.status),
        `unexpected follow-up auto-analyze status: ${followUp.status}`
      )
      if (followUp.status !== 'completed') break
    }
    assert.equal(
      followUp?.status,
      'empty',
      'auto-analyze must reach empty after all pending batches complete'
    )
  }
}

console.log(`integration: daily-report=${daily.reportId}`)
console.log(`integration: weekly-report=${weekly.reportId}`)
console.log('integration: failed-cases=2, deadline-notifications=2')
console.log(
  `integration: auto-analyze=${autoAnalyze.status}, analyzed=${autoAnalyze.analyzed}`
)
