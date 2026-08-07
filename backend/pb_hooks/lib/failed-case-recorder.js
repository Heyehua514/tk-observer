/** 总览工作台失败案例实现；权限：仅服务端 hook 调用。 */
const exists = (app, sourceType, sourceId) => {
  try {
    app.findFirstRecordByFilter(
      'failed_cases',
      'source_type = {:sourceType} && source_id = {:sourceId}',
      { sourceType, sourceId }
    )
    return true
  } catch (_) {
    return false
  }
}

const save = (app, sourceType, sourceId, reason) => {
  if (!reason || exists(app, sourceType, sourceId)) return 0
  const record = new Record(app.findCollectionByNameOrId('failed_cases'))
  record.set('source_type', sourceType)
  record.set('source_id', sourceId)
  record.set('reason', reason)
  record.set('lessons', '')
  record.set('recorded_at', new Date().toISOString())
  app.save(record)
  return 1
}

module.exports.opportunity = (app, record) => {
  const before = String(record.original().get('stage') || '')
  const after = String(record.get('stage') || '')
  const count =
    before !== 'lost' && after === 'lost'
      ? save(
          app,
          'opportunity',
          record.id,
          String(record.get('lost_reason') || '商机已流失')
        )
      : 0
  console.log(`failed-case: 已记录 ${count} 条失败案例`)
  return count
}

module.exports.eventTask = (app, record) => {
  const dueDate = new Date(String(record.get('due_date') || ''))
  const status = String(record.get('status') || '')
  const count =
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() < Date.now() &&
    status !== 'done'
      ? save(app, 'event_task', record.id, '截止日已过未完成')
      : 0
  console.log(`failed-case: 已记录 ${count} 条失败案例`)
  return count
}
