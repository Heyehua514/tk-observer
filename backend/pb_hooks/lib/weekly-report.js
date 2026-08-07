/** 总览工作台周报实现；权限：仅服务端 hook 调用。 */
const dayMs = 24 * 60 * 60 * 1000

const weekStart = (now) => {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const offset = (shifted.getUTCDay() + 6) % 7
  const local = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - offset
  )
  return new Date(local - 8 * 60 * 60 * 1000)
}

const records = (app, collection, filter, start, end) =>
  app.findRecordsByFilter(collection, filter, '-created', 5000, 0, {
    start: start.toISOString(),
    end: end.toISOString(),
  })

const metrics = (app, start, end) => {
  const between = 'created >= {:start} && created < {:end}'
  const won = records(
    app,
    'audit_logs',
    'entity_type = "opportunity_won" && created >= {:start} && created < {:end}',
    start,
    end
  )
  return {
    videoIdeas: records(app, 'video_ideas', between, start, end).length,
    wonOpportunities: won.length,
    wonAmount: won.reduce(
      (sum, record) => sum + Number(record.get('action') || 0),
      0
    ),
    events: records(app, 'events', between, start, end).length,
  }
}

module.exports.run = (app, now) => {
  const current = now || new Date()
  const currentStart = weekStart(current)
  const nextStart = new Date(currentStart.getTime() + 7 * dayMs)
  const previousStart = new Date(currentStart.getTime() - 7 * dayMs)
  const currentMetrics = metrics(app, currentStart, nextStart)
  const previousMetrics = metrics(app, previousStart, currentStart)
  const comparison = { current: currentMetrics, previous: previousMetrics }
  const trends = `选题 ${previousMetrics.videoIdeas}→${currentMetrics.videoIdeas}；成交 ${previousMetrics.wonOpportunities}→${currentMetrics.wonOpportunities}，金额 ${previousMetrics.wonAmount}→${currentMetrics.wonAmount}；活动 ${previousMetrics.events}→${currentMetrics.events}。`
  const weekStartValue = currentStart.toISOString().replace('T', ' ')
  let report
  try {
    report = app.findFirstRecordByFilter(
      'weekly_reports',
      'week_start = {:weekStart}',
      { weekStart: weekStartValue }
    )
  } catch (_) {
    report = new Record(app.findCollectionByNameOrId('weekly_reports'))
  }
  report.set('week_start', weekStartValue)
  report.set('comparison_json', JSON.stringify(comparison))
  report.set('trends', trends)
  report.set('generated_at', current.toISOString())
  app.save(report)
  const log = new Record(app.findCollectionByNameOrId('audit_logs'))
  log.set('actor_name', '系统')
  log.set('action', 'weekly-report')
  log.set('entity_type', 'cron_run')
  log.set('entity_id', report.id)
  app.save(log)
  console.log(
    `weekly-report: 周报已生成，对比上周 ${previousMetrics.videoIdeas}→${currentMetrics.videoIdeas}`
  )
  return { reportId: report.id, comparison, trends }
}
