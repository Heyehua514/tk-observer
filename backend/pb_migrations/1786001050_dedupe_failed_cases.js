/**
 * 总览工作台失败案例升级兼容：严格唯一索引前合并历史重复记录。
 * 权限：migration 服务端执行；保留最早记录并把其他原因写入 lessons。
 */
migrate(
  (app) => {
    const records = app.findRecordsByFilter(
      'failed_cases',
      '',
      'recorded_at',
      5000,
      0
    )
    const retained = new Map()
    for (const record of records) {
      const key = `${record.get('source_type')}:${record.get('source_id')}`
      const survivor = retained.get(key)
      if (!survivor) {
        retained.set(key, record)
        continue
      }
      const history = [
        String(survivor.get('lessons') || '').trim(),
        `[历史失败原因] ${String(record.get('reason') || '').trim()}`,
      ]
        .filter(Boolean)
        .join('\n')
      survivor.set('lessons', history)
      app.save(survivor)
      app.delete(record)
    }
  },
  () => {
    // 合并后的历史记录不可无损拆分，回滚结构时保留合并结果。
  }
)
