/**
 * 用途：每五分钟调度 WorkBuddy 批量分析待处理视频。
 * 所属工作台：剪辑工作台。
 * 权限：仅服务端 cron 与 PocketBase superuser 手动端点可触发。
 */
cronAdd('auto-analyze', '*/5 * * * *', () => {
  const automation = require(`${__hooks}/lib/auto-analyze.js`)
  automation.run($app, $os)
})

routerAdd('POST', '/api/tk-observer/automation/auto-analyze', (event) => {
  if (!event.hasSuperuserAuth())
    return event.json(403, { message: 'superuser required' })
  const automation = require(`${__hooks}/lib/auto-analyze.js`)
  return event.json(200, automation.run($app, $os))
})
