/**
 * 总览与剪辑工作台自动化安全边界。
 * 权限：AI 结论、截止通知和自动化审计仅允许服务端 hooks 写入。
 */
migrate(
  (app) => {
    const videoIdeas = app.findCollectionByNameOrId('video_ideas')
    const editingAccess =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'
    const serverAnalysis =
      '@request.body.is_viral:isset = false && @request.body.ai_analysis:isset = false && @request.body.analyzed_at:isset = false'
    videoIdeas.createRule = `${editingAccess} && ${serverAnalysis}`
    videoIdeas.updateRule = `${editingAccess} && ${serverAnalysis}`
    app.save(videoIdeas)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.createRule =
      '@request.auth.id != "" && @request.body.type != "deadline"'
    app.save(notifications)

    const auditLogs = app.findCollectionByNameOrId('audit_logs')
    auditLogs.createRule =
      '@request.auth.id != "" && @request.body.entity_type != "cron_run" && @request.body.entity_type != "deadline_notification" && @request.body.entity_type != "opportunity_stage" && @request.body.entity_type != "opportunity_won" && @request.body.entity_type != "event_task_done"'
    app.save(auditLogs)

    const failedCases = app.findCollectionByNameOrId('failed_cases')
    failedCases.indexes = failedCases.indexes
      .filter((index) => !index.includes('idx_failed_cases_source_reason'))
      .concat(
        'CREATE UNIQUE INDEX idx_failed_cases_source ON failed_cases (source_type, source_id)'
      )
    app.save(failedCases)
  },
  (app) => {
    const failedCases = app.findCollectionByNameOrId('failed_cases')
    failedCases.indexes = failedCases.indexes
      .filter((index) => !index.includes('idx_failed_cases_source'))
      .concat(
        'CREATE UNIQUE INDEX idx_failed_cases_source_reason ON failed_cases (source_type, source_id, reason)'
      )
    app.save(failedCases)

    const auditLogs = app.findCollectionByNameOrId('audit_logs')
    auditLogs.createRule = '@request.auth.id != ""'
    app.save(auditLogs)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.createRule = '@request.auth.id != ""'
    app.save(notifications)

    const videoIdeas = app.findCollectionByNameOrId('video_ideas')
    const editingAccess =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'
    videoIdeas.createRule =
      editingAccess + ' && @request.body.is_viral:isset = false'
    videoIdeas.updateRule = videoIdeas.createRule
    app.save(videoIdeas)
  }
)
