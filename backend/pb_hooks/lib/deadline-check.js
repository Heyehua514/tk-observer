/** 总览工作台截止提醒实现；权限：仅服务端 hook 调用。 */
const dayMs = 24 * 60 * 60 * 1000

const dayRange = (now) => {
  const key = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const start = new Date(`${key}T00:00:00+08:00`)
  return {
    key,
    start: start.toISOString(),
    end: new Date(start.getTime() + dayMs).toISOString(),
  }
}

const auditExists = (app, entityId, start) => {
  try {
    app.findFirstRecordByFilter(
      'audit_logs',
      'entity_type = "deadline_notification" && entity_id = {:entityId} && created >= {:start}',
      { entityId, start }
    )
    return true
  } catch (_) {
    return false
  }
}

const saveAudit = (app, entityId, action) => {
  const record = new Record(app.findCollectionByNameOrId('audit_logs'))
  record.set('actor_name', '系统')
  record.set('action', action)
  record.set('entity_type', 'deadline_notification')
  record.set('entity_id', entityId)
  app.save(record)
}

const saveCronRun = (app, date) => {
  const record = new Record(app.findCollectionByNameOrId('audit_logs'))
  record.set('actor_name', '系统')
  record.set('action', 'deadline-check')
  record.set('entity_type', 'cron_run')
  record.set('entity_id', date)
  app.save(record)
}

const notify = (app, recipient, title, content, link) => {
  const record = new Record(app.findCollectionByNameOrId('notifications'))
  record.set('recipient', recipient)
  record.set('type', 'deadline')
  record.set('title', title)
  record.set('content', content)
  record.set('link', link)
  record.set('is_read', false)
  app.save(record)
}

module.exports.run = (app, now) => {
  const range = dayRange(now || new Date())
  let taskCount = 0
  let opportunityCount = 0
  const tasks = app.findRecordsByFilter(
    'event_tasks',
    'due_date >= {:start} && due_date < {:end} && status != "done"',
    'due_date',
    500,
    0,
    { start: range.start, end: range.end }
  )
  for (const task of tasks) {
    const recipient = String(task.get('assignee') || '')
    const auditId = `task:${task.id}`
    if (!recipient || auditExists(app, auditId, range.start)) continue
    notify(
      app,
      recipient,
      '活动任务今日截止',
      `「${String(task.get('title') || '活动任务')}」今天截止，请及时处理。`,
      '/market'
    )
    saveAudit(app, auditId, '活动任务截止提醒')
    taskCount += 1
  }
  const opportunities = app.findRecordsByFilter(
    'opportunities',
    'expected_close >= {:start} && expected_close < {:end} && stage != "won" && stage != "lost"',
    'expected_close',
    500,
    0,
    { start: range.start, end: range.end }
  )
  for (const opportunity of opportunities) {
    const recipient = String(opportunity.get('created_by') || '')
    const auditId = `opportunity:${opportunity.id}`
    if (!recipient || auditExists(app, auditId, range.start)) continue
    notify(
      app,
      recipient,
      '商机预计今日成交',
      `「${String(opportunity.get('title') || '商机')}」预计今天成交，请更新跟进状态。`,
      '/business'
    )
    saveAudit(app, auditId, '商机截止提醒')
    opportunityCount += 1
  }
  saveCronRun(app, range.key)
  console.log(
    `deadline-check: ${taskCount} 条任务+${opportunityCount} 条商机已提醒`
  )
  return { date: range.key, taskCount, opportunityCount }
}

module.exports.assignCreator = (event) => {
  if (event.auth && !event.auth.isSuperuser())
    event.record.set('created_by', event.auth.id)
}
