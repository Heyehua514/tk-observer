/**
 * 通知自动化：设计审批、GMV 达标与新评论成功写入后创建站内通知。
 * 所有 hook 都在 finally 中继续主请求，通知失败不会把主业务写入变成 HTTP 错误。
 */
const createNotification = (recipient, type, title, content, link) => {
  if (!recipient) return
  const collection = $app.findCollectionByNameOrId('notifications')
  const notification = new Record(collection)
  notification.set('recipient', recipient)
  notification.set('type', type)
  notification.set('title', title)
  notification.set('content', content)
  notification.set('link', link || '')
  notification.set('is_read', false)
  $app.save(notification)
}

onRecordAfterUpdateSuccess((event) => {
  try {
    const status = String(event.record.get('status') || '')
    if (status !== 'approved' && status !== 'rejected') return
    const title = status === 'approved' ? '设计稿已通过' : '设计稿已驳回'
    const reason = String(event.record.get('review_reason') || '')
    const content =
      status === 'approved'
        ? `「${String(event.record.get('file_name') || '设计稿')}」已通过审核。`
        : `「${String(event.record.get('file_name') || '设计稿')}」已驳回：${reason}`
    createNotification(
      event.record.get('owner'),
      'design_review',
      title,
      content,
      '/design'
    )
  } catch (_) {
    // Notifications are non-blocking; the design status remains authoritative.
  } finally {
    event.next()
  }
}, 'design_assets')

const notifyGmvTarget = (event) => {
  try {
    const amount = Number(event.record.get('amount_minor') || 0)
    if (amount < 1000000) return
    const bosses = $app.findRecordsByFilter(
      'users',
      'role = "boss"',
      '-created',
      50,
      0
    )
    for (const boss of bosses) {
      createNotification(
        boss.id,
        'gmv_target',
        'GMV 达标提醒',
        `GMV 已达到 $${(amount / 100).toLocaleString('en-US')}。`,
        '/overview'
      )
    }
  } catch (_) {
    // Notifications are non-blocking; the metric write remains authoritative.
  } finally {
    event.next()
  }
}

onRecordAfterCreateSuccess(notifyGmvTarget, 'gmv_metrics')
onRecordAfterUpdateSuccess(notifyGmvTarget, 'gmv_metrics')

onRecordAfterCreateSuccess((event) => {
  try {
    createNotification(
      event.record.get('recipient'),
      'comment',
      '收到新评论',
      String(event.record.get('content') || ''),
      String(event.record.get('link') || '')
    )
  } catch (_) {
    // Notifications are non-blocking; the comment remains authoritative.
  } finally {
    event.next()
  }
}, 'comments')

onRecordUpdateRequest((event) => {
  const status = String(event.record.get('status') || '')
  const reason = String(event.record.get('review_reason') || '').trim()
  if (status === 'rejected' && !reason) {
    throw new BadRequestError('设计稿驳回必须填写理由')
  }
  event.next()
}, 'design_assets')
