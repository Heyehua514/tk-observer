/**
 * 总览自动化：每周一 08:00 对比本周与上周的选题、成交和活动。
 * 权限：cron 服务端执行；手动触发端点仅 PocketBase superuser。
 */
cronAdd('weekly-report', '0 8 * * 1', () => {
  const automation = require(`${__hooks}/lib/weekly-report.js`)
  return automation.run($app, new Date())
})

routerAdd('POST', '/api/tk-observer/automation/weekly-report', (event) => {
  if (!event.hasSuperuserAuth())
    return event.json(403, { message: 'superuser required' })
  const automation = require(`${__hooks}/lib/weekly-report.js`)
  return event.json(200, automation.run($app, new Date()))
})
