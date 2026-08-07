/**
 * 总览自动化：把流失商机和更新时已过期的未完成任务沉淀为失败案例。
 * 权限：服务端记录；失败案例仅 boss 可读取。
 */
onRecordAfterUpdateSuccess((event) => {
  try {
    const automation = require(`${__hooks}/lib/failed-case-recorder.js`)
    automation.opportunity($app, event.record)
  } finally {
    event.next()
  }
}, 'opportunities')

onRecordAfterUpdateSuccess((event) => {
  try {
    const automation = require(`${__hooks}/lib/failed-case-recorder.js`)
    automation.eventTask($app, event.record)
  } finally {
    event.next()
  }
}, 'event_tasks')
