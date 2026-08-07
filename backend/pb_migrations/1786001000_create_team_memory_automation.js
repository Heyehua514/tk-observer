/**
 * 总览工作台团队记忆自动化数据层。
 * 权限：仅 boss 可读取报告和失败案例；所有写入只允许服务端 hooks。
 */
migrate(
  (app) => {
    const bossRead =
      '@request.auth.id != "" && @request.auth.role = "boss"'
    const users = app.findCollectionByNameOrId('users')

    const dailyReports = new Collection({
      type: 'base',
      name: 'daily_reports',
    })
    dailyReports.listRule = bossRead
    dailyReports.viewRule = bossRead
    dailyReports.createRule = null
    dailyReports.updateRule = null
    dailyReports.deleteRule = null
    dailyReports.fields.add(new DateField({ name: 'date', required: true }))
    dailyReports.fields.add(
      new TextField({ name: 'stats_json', required: true, max: 50000 })
    )
    dailyReports.fields.add(
      new TextField({ name: 'highlights', required: true, max: 5000 })
    )
    dailyReports.fields.add(
      new DateField({ name: 'generated_at', required: true })
    )
    dailyReports.indexes = [
      'CREATE UNIQUE INDEX idx_daily_reports_date ON daily_reports (date)',
    ]
    app.save(dailyReports)

    const weeklyReports = new Collection({
      type: 'base',
      name: 'weekly_reports',
    })
    weeklyReports.listRule = bossRead
    weeklyReports.viewRule = bossRead
    weeklyReports.createRule = null
    weeklyReports.updateRule = null
    weeklyReports.deleteRule = null
    weeklyReports.fields.add(
      new DateField({ name: 'week_start', required: true })
    )
    weeklyReports.fields.add(
      new TextField({ name: 'comparison_json', required: true, max: 50000 })
    )
    weeklyReports.fields.add(
      new TextField({ name: 'trends', required: true, max: 5000 })
    )
    weeklyReports.fields.add(
      new DateField({ name: 'generated_at', required: true })
    )
    weeklyReports.indexes = [
      'CREATE UNIQUE INDEX idx_weekly_reports_start ON weekly_reports (week_start)',
    ]
    app.save(weeklyReports)

    const failedCases = new Collection({
      type: 'base',
      name: 'failed_cases',
    })
    failedCases.listRule = bossRead
    failedCases.viewRule = bossRead
    failedCases.createRule = null
    failedCases.updateRule = null
    failedCases.deleteRule = null
    failedCases.fields.add(
      new SelectField({
        name: 'source_type',
        required: true,
        maxSelect: 1,
        values: ['opportunity', 'event_task'],
      })
    )
    failedCases.fields.add(
      new TextField({ name: 'source_id', required: true, max: 40 })
    )
    failedCases.fields.add(
      new TextField({ name: 'reason', required: true, max: 2000 })
    )
    failedCases.fields.add(new TextField({ name: 'lessons', max: 5000 }))
    failedCases.fields.add(
      new DateField({ name: 'recorded_at', required: true })
    )
    failedCases.indexes = [
      'CREATE UNIQUE INDEX idx_failed_cases_source_reason ON failed_cases (source_type, source_id, reason)',
      'CREATE INDEX idx_failed_cases_recorded ON failed_cases (recorded_at DESC)',
    ]
    app.save(failedCases)

    const notifications = app.findCollectionByNameOrId('notifications')
    const notificationType = notifications.fields.getByName('type')
    notificationType.values = Array.from(
      new Set([...notificationType.values, 'deadline'])
    )
    app.save(notifications)

    const opportunities = app.findCollectionByNameOrId('opportunities')
    opportunities.fields.add(
      new RelationField({
        name: 'created_by',
        collectionId: users.id,
        maxSelect: 1,
      })
    )
    app.save(opportunities)

    const videoIdeas = app.findCollectionByNameOrId('video_ideas')
    videoIdeas.fields.add(
      new TextField({ name: 'ai_analysis', max: 10000 })
    )
    videoIdeas.fields.add(new DateField({ name: 'analyzed_at' }))
    app.save(videoIdeas)
  },
  (app) => {
    const videoIdeas = app.findCollectionByNameOrId('video_ideas')
    videoIdeas.fields.removeByName('ai_analysis')
    videoIdeas.fields.removeByName('analyzed_at')
    app.save(videoIdeas)

    const opportunities = app.findCollectionByNameOrId('opportunities')
    opportunities.fields.removeByName('created_by')
    app.save(opportunities)

    const notifications = app.findCollectionByNameOrId('notifications')
    const notificationType = notifications.fields.getByName('type')
    notificationType.values = notificationType.values.filter(
      (value) => value !== 'deadline'
    )
    app.save(notifications)

    for (const name of ['failed_cases', 'weekly_reports', 'daily_reports']) {
      app.delete(app.findCollectionByNameOrId(name))
    }
  }
)
