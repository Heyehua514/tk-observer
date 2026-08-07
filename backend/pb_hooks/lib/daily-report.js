/** 总览工作台日报实现；权限：仅服务端 hook 调用。 */
const dayMs = 24 * 60 * 60 * 1000

const dayRange = (now) => {
  const key = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const start = new Date(`${key}T00:00:00+08:00`)
  return {
    key,
    date: `${key} 00:00:00.000Z`,
    start: start.toISOString(),
    end: new Date(start.getTime() + dayMs).toISOString(),
  }
}

const records = (app, collection, filter, params) =>
  app.findRecordsByFilter(collection, filter, '-created', 5000, 0, params)

const audit = (app, entityType, entityId, action) => {
  const record = new Record(app.findCollectionByNameOrId('audit_logs'))
  record.set('actor_name', '系统')
  record.set('action', action)
  record.set('entity_type', entityType)
  record.set('entity_id', entityId || '')
  app.save(record)
}

module.exports.run = (app, now) => {
  const current = now || new Date()
  const range = dayRange(current)
  const between = 'created >= {:start} && created < {:end}'
  const stats = {
    newClients: records(app, 'clients', between, range).length,
    newVideoIdeas: records(app, 'video_ideas', between, range).length,
    opportunityStageChanges: records(
      app,
      'audit_logs',
      'entity_type = "opportunity_stage" && created >= {:start} && created < {:end}',
      range
    ).length,
    completedEventTasks: records(
      app,
      'audit_logs',
      'entity_type = "event_task_done" && created >= {:start} && created < {:end}',
      range
    ).length,
  }
  const highlights = `今日新增客户 ${stats.newClients} 个、选题 ${stats.newVideoIdeas} 条；商机阶段变化 ${stats.opportunityStageChanges} 次，完成活动任务 ${stats.completedEventTasks} 项。`
  let report
  try {
    report = app.findFirstRecordByFilter('daily_reports', 'date = {:date}', {
      date: range.date,
    })
  } catch (_) {
    report = new Record(app.findCollectionByNameOrId('daily_reports'))
  }
  report.set('date', range.date)
  report.set('stats_json', JSON.stringify(stats))
  report.set('highlights', highlights)
  report.set('generated_at', current.toISOString())
  app.save(report)
  audit(app, 'cron_run', report.id, 'daily-report')
  console.log(`daily-report: 已生成 ${range.key} 日报`)
  return { date: range.key, reportId: report.id, stats, highlights }
}

module.exports.recordStageChange = (app, record) => {
  const before = String(record.original().get('stage') || '')
  const after = String(record.get('stage') || '')
  if (before && after && before !== after) {
    audit(app, 'opportunity_stage', record.id, `${before}->${after}`)
    if (after === 'won') {
      audit(app, 'opportunity_won', record.id, String(record.get('amount') || 0))
    }
  }
}

module.exports.recordTaskCompletion = (app, record) => {
  const before = String(record.original().get('status') || '')
  const after = String(record.get('status') || '')
  if (before !== 'done' && after === 'done') {
    audit(app, 'event_task_done', record.id, 'done')
  }
}
