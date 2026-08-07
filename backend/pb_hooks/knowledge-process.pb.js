/**
 * 用途：飞书文档创建 30 秒后触发知识提炼，并于每天 22:00 补扫超过 24 小时的 pending 文档。
 * 所属工作台：知识库。
 * 权限：仅 PocketBase 服务端事件与 cron 可触发。
 */
onRecordAfterCreateSuccess((event) => {
  try {
    if (String(event.record.get('sync_status') || '') === 'pending') {
      sleep(30_000)
      const automation = require(`${__hooks}/lib/knowledge-process.js`)
      automation.processDocument($app, $os, event.record)
    }
  } finally {
    event.next()
  }
}, 'feishu_documents')

cronAdd('knowledge-process-stale-pending', '0 22 * * *', () => {
  const automation = require(`${__hooks}/lib/knowledge-process.js`)
  return automation.processStalePending($app, $os, new Date())
})
