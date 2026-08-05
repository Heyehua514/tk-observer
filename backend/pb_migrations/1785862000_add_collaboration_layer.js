/**
 * 团队协作层 migration。
 * 设计工作台：design_assets 增加审批状态、所有者、驳回理由和审核人。
 * 全局：新增 notifications 和 comments，用于审批、GMV 达标和评论提醒。
 * 商务/剪辑：videos 增加 creator 关联，商务角色获得只读权限。
 */
migrate(
  (app) => {
    const authenticated = '@request.auth.id != ""'
    const users = app.findCollectionByNameOrId('users')
    const creators = app.findCollectionByNameOrId('creators')

    const designAssets = app.findCollectionByNameOrId('design_assets')
    designAssets.fields.add(
      new SelectField({
        name: 'status',
        maxSelect: 1,
        values: ['draft', 'pending_review', 'approved', 'rejected'],
      })
    )
    designAssets.fields.add(
      new RelationField({
        name: 'owner',
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: false,
      })
    )
    designAssets.fields.add(
      new TextField({ name: 'review_reason', max: 1000 })
    )
    designAssets.fields.add(
      new RelationField({
        name: 'reviewed_by',
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: false,
      })
    )
    designAssets.fields.add(new DateField({ name: 'reviewed_at' }))
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || (@request.auth.role = "design" && (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending_review")))'
    designAssets.indexes = [
      ...designAssets.indexes,
      'CREATE INDEX idx_design_assets_status_owner ON design_assets (status, owner)',
    ]
    app.save(designAssets)

    const videos = app.findCollectionByNameOrId('videos')
    videos.fields.add(
      new RelationField({
        name: 'creator',
        maxSelect: 1,
        collectionId: creators.id,
        cascadeDelete: false,
      })
    )
    videos.listRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing" || @request.auth.role = "business")'
    videos.viewRule = videos.listRule
    videos.indexes = [
      ...videos.indexes,
      'CREATE INDEX idx_videos_creator ON videos (creator)',
    ]
    app.save(videos)

    const notifications = new Collection({
      type: 'base',
      name: 'notifications',
    })
    notifications.listRule =
      '@request.auth.id != "" && recipient = @request.auth.id'
    notifications.viewRule = notifications.listRule
    notifications.createRule = authenticated
    notifications.updateRule = notifications.listRule
    notifications.deleteRule = notifications.listRule
    notifications.fields.add(
      new RelationField({
        name: 'recipient',
        required: true,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: true,
      })
    )
    notifications.fields.add(
      new SelectField({
        name: 'type',
        required: true,
        maxSelect: 1,
        values: ['design_review', 'gmv_target', 'comment'],
      })
    )
    notifications.fields.add(
      new TextField({ name: 'title', required: true, max: 160 })
    )
    notifications.fields.add(
      new TextField({ name: 'content', required: true, max: 1000 })
    )
    notifications.fields.add(new TextField({ name: 'link', max: 500 }))
    notifications.fields.add(new BoolField({ name: 'is_read' }))
    notifications.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    notifications.indexes = [
      'CREATE INDEX idx_notifications_recipient_read_created ON notifications (recipient, is_read, created DESC)',
    ]
    app.save(notifications)

    const comments = new Collection({ type: 'base', name: 'comments' })
    comments.listRule =
      '@request.auth.id != "" && (author = @request.auth.id || recipient = @request.auth.id || @request.auth.role = "boss")'
    comments.viewRule = comments.listRule
    comments.createRule = authenticated
    comments.updateRule =
      '@request.auth.id != "" && author = @request.auth.id'
    comments.deleteRule = comments.updateRule
    comments.fields.add(
      new RelationField({
        name: 'author',
        required: true,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: true,
      })
    )
    comments.fields.add(
      new RelationField({
        name: 'recipient',
        required: true,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: true,
      })
    )
    comments.fields.add(
      new TextField({ name: 'content', required: true, max: 1000 })
    )
    comments.fields.add(new TextField({ name: 'link', max: 500 }))
    comments.fields.add(
      new SelectField({
        name: 'region',
        required: true,
        maxSelect: 1,
        values: ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG'],
      })
    )
    comments.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    comments.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    comments.indexes = [
      'CREATE INDEX idx_comments_recipient_created ON comments (recipient, created DESC)',
    ]
    app.save(comments)

    // 独立测试账号不占用真实成员姓名，保留自助注册能力。
    const testAccounts = [
      ['测试·磊哥', 'test.boss@tkobserver.local', 'boss', 'TkTestBoss@2026!'],
      [
        '测试·董雨辰',
        'test.business@tkobserver.local',
        'business',
        'TkTestBusiness@2026!',
      ],
      ['测试·韩素云', 'test.market@tkobserver.local', 'market', 'TkTestMarket@2026!'],
      ['测试·孙铭泽', 'test.design@tkobserver.local', 'design', 'TkTestDesign@2026!'],
      ['测试·谢洁', 'test.editing@tkobserver.local', 'editing', 'TkTestEditing@2026!'],
    ]
    const createdAccounts = {}
    for (const [name, email, role, password] of testAccounts) {
      try {
        createdAccounts[role] = app.findAuthRecordByEmail('users', email)
      } catch (_) {
        const record = new Record(users)
        record.set('name', name)
        record.set('email', email)
        record.set('role', role)
        record.set('verified', true)
        record.setPassword(password)
        app.save(record)
        createdAccounts[role] = record
      }
    }

    const sampleNotifications = [
      [
        createdAccounts.design.id,
        'design_review',
        '设计稿审批结果',
        '示例：设计稿通过或驳回后会在这里通知。',
        '/design',
      ],
      [
        createdAccounts.boss.id,
        'gmv_target',
        'GMV 达标提醒',
        '示例：当日 GMV 达到 $10,000。',
        '/overview',
      ],
      [
        createdAccounts.boss.id,
        'comment',
        '收到新评论',
        '示例：团队成员在业务数据下留了评论。',
        '/overview',
      ],
    ]
    for (const [recipient, type, title, content, link] of sampleNotifications) {
      const record = new Record(notifications)
      record.set('recipient', recipient)
      record.set('type', type)
      record.set('title', title)
      record.set('content', content)
      record.set('link', link)
      record.set('is_read', false)
      app.save(record)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('comments'))
    app.delete(app.findCollectionByNameOrId('notifications'))

    const videos = app.findCollectionByNameOrId('videos')
    videos.fields.removeByName('creator')
    videos.listRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'
    videos.viewRule = videos.listRule
    videos.indexes = videos.indexes.filter(
      (index) => !index.includes('idx_videos_creator')
    )
    app.save(videos)

    const designAssets = app.findCollectionByNameOrId('design_assets')
    for (const field of [
      'status',
      'owner',
      'review_reason',
      'reviewed_by',
      'reviewed_at',
    ]) {
      designAssets.fields.removeByName(field)
    }
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "design")'
    designAssets.indexes = designAssets.indexes.filter(
      (index) => !index.includes('idx_design_assets_status_owner')
    )
    app.save(designAssets)

    const testEmails = [
      'test.boss@tkobserver.local',
      'test.business@tkobserver.local',
      'test.market@tkobserver.local',
      'test.design@tkobserver.local',
      'test.editing@tkobserver.local',
    ]
    for (const email of testEmails) {
      try {
        app.delete(app.findAuthRecordByEmail('users', email))
      } catch (_) {
        // Rollback remains idempotent.
      }
    }
  }
)
