/** 市场活动创建后自动生成标准收支模板，金额默认 0。 */
onRecordAfterCreateSuccess((event) => {
  const templates = [
    ['sponsorship_income', 'income', '赞助收入'],
    ['ticket_income', 'income', '票务收入'],
    ['venue', 'expense', '场地费'],
    ['setup', 'expense', '布置费'],
    ['catering', 'expense', '餐饮费'],
    ['printing', 'expense', '物料印刷'],
    ['travel', 'expense', '嘉宾差旅'],
  ]
  const collection = $app.findCollectionByNameOrId('event_finances')
  for (const [category, type, description] of templates) {
    const record = new Record(collection)
    record.set('event', event.record.id)
    record.set('category', category)
    record.set('type', type)
    record.set('amount', 0)
    record.set('description', description)
    $app.save(record)
  }
  const phaseCollection = $app.findCollectionByNameOrId('event_phases')
  const phases = [
    'P0 立项定档',
    'P1 资源锁定',
    'P2 宣发招募',
    'P3 落地执行',
    'P4 会后复盘',
  ]
  for (let index = 0; index < phases.length; index += 1) {
    const phase = new Record(phaseCollection)
    phase.set('event', event.record.id)
    phase.set('name', phases[index])
    phase.set('phase_order', index)
    phase.set('status', 'not_started')
    phase.set('completion_pct', 0)
    $app.save(phase)
  }
  event.next()
}, 'events')
