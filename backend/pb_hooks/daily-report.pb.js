/**
 * 总览自动化：每天 18:00 汇总当日业务增量并生成日报。
 * 权限：cron 服务端执行；手动触发端点仅 PocketBase superuser。
 */
onRecordAfterUpdateSuccess((event) => {
  try {
    const automation = require(`${__hooks}/lib/daily-report.js`)
    automation.recordStageChange($app, event.record)
  } finally {
    event.next()
  }
}, 'opportunities')

onRecordAfterUpdateSuccess((event) => {
  try {
    const automation = require(`${__hooks}/lib/daily-report.js`)
    automation.recordTaskCompletion($app, event.record)
  } finally {
    event.next()
  }
}, 'event_tasks')

cronAdd('daily-report', '0 18 * * *', () => {
  const automation = require(`${__hooks}/lib/daily-report.js`)
  return automation.run($app, new Date())
})

routerAdd('POST', '/api/tk-observer/automation/daily-report', (event) => {
  if (!event.hasSuperuserAuth())
    return event.json(403, { message: 'superuser required' })
  const automation = require(`${__hooks}/lib/daily-report.js`)
  return event.json(200, automation.run($app, new Date()))
})
