/**
 * 用途：为 social_plans 追加使用计数和最近使用时间，支撑模板闭环追踪。
 * 所属工作台：商务工作台。
 * 权限：仅服务端 migration 执行，客户端不可直接改结构。
 */
migrate(
  (app) => {
    const socialPlans = app.findCollectionByNameOrId('social_plans')
    socialPlans.fields.add(
      new NumberField({ name: 'usage_count', min: 0, onlyInt: true }),
    )
    socialPlans.fields.add(new DateField({ name: 'last_used_at' }))
    app.save(socialPlans)

    const records = app.findRecordsByFilter('social_plans', '', '-created', 5000, 0)
    for (const record of records) {
      if (Number(record.get('usage_count') || 0) !== 0) continue
      record.set('usage_count', 0)
      app.save(record)
    }
  },
  (app) => {
    const socialPlans = app.findCollectionByNameOrId('social_plans')
    socialPlans.fields.removeByName('usage_count')
    socialPlans.fields.removeByName('last_used_at')
    app.save(socialPlans)
  },
)
