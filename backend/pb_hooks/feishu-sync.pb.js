/**
 * 用途：按固定时段同步已连接成员的飞书文档、知识库和多维表格。
 * 权限：仅服务端 cron 执行，不注册客户端或手动触发端点。
 */
cronAdd('feishu-documents-sync', '0 8,14,20 * * *', () => {
  const sync = require(`${__hooks}/lib/feishu-sync.js`)
  return sync.run($app, $http, $security, $os, ['doc', 'wiki'])
})

cronAdd('feishu-bitable-sync', '0 8 * * *', () => {
  const sync = require(`${__hooks}/lib/feishu-sync.js`)
  return sync.run($app, $http, $security, $os, ['bitable'])
})
