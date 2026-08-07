/**
 * 剪辑工作台：微信视频号内容运营数据层。
 * video_ideas 保存爆款选题与表现数据；import_history 保存 CSV 导入快照。
 * competitor_* 与 trending_topics 保存对标账号、风格分析和热点调研结果。
 */
migrate(
  (app) => {
    const editingAccess =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'
    const editableWithoutViral =
      editingAccess + ' && @request.body.is_viral:isset = false'

    const videoIdeas = new Collection({ type: 'base', name: 'video_ideas' })
    videoIdeas.listRule = editingAccess
    videoIdeas.viewRule = editingAccess
    videoIdeas.createRule = editableWithoutViral
    videoIdeas.updateRule = editableWithoutViral
    videoIdeas.deleteRule = editingAccess
    videoIdeas.fields.add(
      new SelectField({
        name: 'account',
        required: true,
        maxSelect: 1,
        values: ['跨境TK磊哥', 'TK观察磊哥', '磊哥出海笔记'],
      })
    )
    videoIdeas.fields.add(
      new SelectField({
        name: 'video_type',
        required: true,
        maxSelect: 1,
        values: [
          '口播',
          '专访预热',
          '专访正片',
          '专访花絮',
          '快问快答',
          '茶话会',
          '饭局交流',
          '饭局感受',
        ],
      })
    )
    videoIdeas.fields.add(
      new TextField({ name: 'title', required: true, max: 240 })
    )
    videoIdeas.fields.add(new TextField({ name: 'description', max: 5000 }))
    videoIdeas.fields.add(new URLField({ name: 'source_url' }))
    videoIdeas.fields.add(new TextField({ name: 'tags', max: 1000 }))
    videoIdeas.fields.add(new DateField({ name: 'publish_date', required: true }))
    for (const field of [
      'views',
      'likes',
      'comments',
      'shares',
      'completion_rate',
      'follower_gain',
    ]) {
      videoIdeas.fields.add(
        new NumberField({ name: field, min: 0, onlyInt: true })
      )
    }
    videoIdeas.fields.add(new BoolField({ name: 'is_viral' }))
    videoIdeas.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    videoIdeas.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    videoIdeas.indexes = [
      'CREATE UNIQUE INDEX idx_video_ideas_title_publish ON video_ideas (title, publish_date)',
      'CREATE INDEX idx_video_ideas_account_views ON video_ideas (account, views DESC)',
      'CREATE INDEX idx_video_ideas_viral_publish ON video_ideas (is_viral, publish_date DESC)',
    ]
    app.save(videoIdeas)

    const importHistory = new Collection({
      type: 'base',
      name: 'import_history',
    })
    importHistory.listRule = editingAccess
    importHistory.viewRule = editingAccess
    importHistory.createRule = editingAccess
    importHistory.updateRule = null
    importHistory.deleteRule = editingAccess
    importHistory.fields.add(
      new DateField({ name: 'imported_at', required: true })
    )
    importHistory.fields.add(
      new TextField({ name: 'file_name', required: true, max: 240 })
    )
    for (const field of ['total_rows', 'new_count', 'updated_count']) {
      importHistory.fields.add(
        new NumberField({ name: field, min: 0, onlyInt: true })
      )
    }
    importHistory.fields.add(new JSONField({ name: 'snapshot', maxSize: 100000 }))
    importHistory.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    importHistory.indexes = [
      'CREATE INDEX idx_import_history_imported ON import_history (imported_at DESC)',
    ]
    app.save(importHistory)

    const competitorAccounts = new Collection({
      type: 'base',
      name: 'competitor_accounts',
    })
    competitorAccounts.listRule = editingAccess
    competitorAccounts.viewRule = editingAccess
    competitorAccounts.createRule = editingAccess
    competitorAccounts.updateRule = editingAccess
    competitorAccounts.deleteRule = editingAccess
    competitorAccounts.fields.add(
      new TextField({ name: 'name', required: true, max: 160 })
    )
    competitorAccounts.fields.add(
      new TextField({ name: 'platform', required: true, max: 60 })
    )
    competitorAccounts.fields.add(new URLField({ name: 'profile_url' }))
    competitorAccounts.fields.add(new TextField({ name: 'category', max: 120 }))
    competitorAccounts.fields.add(
      new NumberField({ name: 'follower_count', min: 0, onlyInt: true })
    )
    competitorAccounts.fields.add(
      new NumberField({ name: 'avg_views', min: 0, onlyInt: true })
    )
    competitorAccounts.fields.add(new TextField({ name: 'notes', max: 5000 }))
    competitorAccounts.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    competitorAccounts.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    competitorAccounts.indexes = [
      'CREATE UNIQUE INDEX idx_competitor_accounts_name ON competitor_accounts (name)',
    ]
    app.save(competitorAccounts)

    const competitorVideos = new Collection({
      type: 'base',
      name: 'competitor_videos',
    })
    competitorVideos.listRule = editingAccess
    competitorVideos.viewRule = editingAccess
    competitorVideos.createRule = editingAccess
    competitorVideos.updateRule = editingAccess
    competitorVideos.deleteRule = editingAccess
    competitorVideos.fields.add(
      new RelationField({
        name: 'competitor',
        required: true,
        maxSelect: 1,
        collectionId: competitorAccounts.id,
        cascadeDelete: true,
      })
    )
    competitorVideos.fields.add(
      new TextField({ name: 'title', required: true, max: 240 })
    )
    competitorVideos.fields.add(new URLField({ name: 'url' }))
    competitorVideos.fields.add(new DateField({ name: 'publish_date' }))
    competitorVideos.fields.add(
      new NumberField({ name: 'views', min: 0, onlyInt: true })
    )
    competitorVideos.fields.add(
      new NumberField({ name: 'likes', min: 0, onlyInt: true })
    )
    competitorVideos.fields.add(
      new TextField({ name: 'content_tags', max: 1000 })
    )
    competitorVideos.fields.add(
      new TextField({ name: 'why_viral', max: 5000 })
    )
    competitorVideos.fields.add(
      new TextField({ name: 'reference_to', max: 5000 })
    )
    competitorVideos.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    competitorVideos.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    competitorVideos.indexes = [
      'CREATE INDEX idx_competitor_videos_account_views ON competitor_videos (competitor, views DESC)',
    ]
    app.save(competitorVideos)

    const trendingTopics = new Collection({
      type: 'base',
      name: 'trending_topics',
    })
    trendingTopics.listRule = editingAccess
    trendingTopics.viewRule = editingAccess
    trendingTopics.createRule = editingAccess
    trendingTopics.updateRule = editingAccess
    trendingTopics.deleteRule = editingAccess
    trendingTopics.fields.add(
      new TextField({ name: 'topic', required: true, max: 240 })
    )
    trendingTopics.fields.add(new TextField({ name: 'source', max: 240 }))
    trendingTopics.fields.add(new TextField({ name: 'keywords', max: 1000 }))
    trendingTopics.fields.add(
      new SelectField({
        name: 'heat_level',
        required: true,
        maxSelect: 1,
        values: ['高', '中', '低'],
      })
    )
    trendingTopics.fields.add(new TextField({ name: 'insight', max: 5000 }))
    trendingTopics.fields.add(new URLField({ name: 'reference_url' }))
    trendingTopics.fields.add(
      new DateField({ name: 'discovered_at', required: true })
    )
    trendingTopics.fields.add(new BoolField({ name: 'converted_to_idea' }))
    trendingTopics.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    trendingTopics.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    trendingTopics.indexes = [
      'CREATE INDEX idx_trending_topics_heat_discovered ON trending_topics (heat_level, discovered_at DESC)',
    ]
    app.save(trendingTopics)

    const styleAnalyses = new Collection({
      type: 'base',
      name: 'competitor_style_analysis',
    })
    styleAnalyses.listRule = editingAccess
    styleAnalyses.viewRule = editingAccess
    styleAnalyses.createRule = editingAccess
    styleAnalyses.updateRule = editingAccess
    styleAnalyses.deleteRule = editingAccess
    styleAnalyses.fields.add(
      new RelationField({
        name: 'competitor',
        required: true,
        maxSelect: 1,
        collectionId: competitorAccounts.id,
        cascadeDelete: true,
      })
    )
    for (const field of [
      'content_style',
      'title_pattern',
      'hook_method',
      'editing_style',
      'viral_factors',
      'applicable_to_us',
    ]) {
      styleAnalyses.fields.add(new TextField({ name: field, max: 5000 }))
    }
    styleAnalyses.fields.add(
      new DateField({ name: 'analyzed_at', required: true })
    )
    styleAnalyses.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    styleAnalyses.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    styleAnalyses.indexes = [
      'CREATE INDEX idx_style_analysis_competitor_date ON competitor_style_analysis (competitor, analyzed_at DESC)',
    ]
    app.save(styleAnalyses)

    for (const name of ['跨境班长', '吞吞的出海营销策略', 'tk大文豪']) {
      const record = new Record(competitorAccounts)
      record.set('name', name)
      record.set('platform', '微信视频号')
      record.set('category', '出海跨境')
      record.set('follower_count', 0)
      record.set('avg_views', 0)
      app.save(record)
    }
  },
  (app) => {
    for (const name of [
      'competitor_style_analysis',
      'trending_topics',
      'competitor_videos',
      'competitor_accounts',
      'import_history',
      'video_ideas',
    ]) {
      app.delete(app.findCollectionByNameOrId(name))
    }
  }
)
