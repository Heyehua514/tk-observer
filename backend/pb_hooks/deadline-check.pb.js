/**
 * 总览自动化：每天 08:00 检查活动任务和商机截止日并发送站内通知。
 * 权限：cron 服务端执行；手动触发端点仅 PocketBase superuser。
 */
onRecordCreateRequest((event) => {
  const automation = require(`${__hooks}/lib/deadline-check.js`)
  automation.assignCreator(event)
  event.next()
}, 'opportunities')

cronAdd('deadline-check', '0 8 * * *', () => {
  const automation = require(`${__hooks}/lib/deadline-check.js`)
  return automation.run($app, new Date())
})

routerAdd('POST', '/api/tk-observer/automation/deadline-check', (event) => {
  if (!event.hasSuperuserAuth())
    return event.json(403, { message: 'superuser required' })
  const automation = require(`${__hooks}/lib/deadline-check.js`)
  return event.json(200, automation.run($app, new Date()))
})
