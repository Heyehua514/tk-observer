/**
 * TK观察核心数据模型。
 * 所有业务时间由 PocketBase 以 UTC 存储；金额使用最小货币单位整数。
 * Collection API Rules 以角色为真正安全边界，前端守卫只改善用户体验。
 */
migrate(
  (app) => {
    const roleRule = (role) =>
      `@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "${role}")`

    const regionField = () =>
      new SelectField({
        name: 'region',
        required: true,
        maxSelect: 1,
        values: ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG'],
      })

    const currencyField = () =>
      new SelectField({
        name: 'currency',
        required: true,
        maxSelect: 1,
        values: ['USD', 'GBP', 'IDR', 'THB', 'VND', 'MYR', 'PHP', 'SGD'],
      })

    const saveBase = (definition, role) => {
      const rule = roleRule(role)
      const collection = new Collection({ type: 'base', name: definition.name })
      collection.listRule = rule
      collection.viewRule = rule
      collection.createRule = rule
      collection.updateRule = rule
      collection.deleteRule = rule
      for (const field of definition.fields) collection.fields.add(field)
      collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
      collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      collection.indexes = definition.indexes || []
      app.save(collection)
    }

    // 全员认证账号：name 为中文姓名，role 决定工作台和数据权限。
    const users = app.findCollectionByNameOrId('users')
    users.listRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || id = @request.auth.id)'
    users.viewRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || id = @request.auth.id)'
    users.createRule = null
    users.updateRule = '@request.auth.id != "" && id = @request.auth.id'
    users.deleteRule = null
    users.fields.add(
      new SelectField({
        name: 'role',
        required: true,
        maxSelect: 1,
        values: ['boss', 'business', 'market', 'design', 'editing'],
      })
    )
    app.save(users)

    // 商务工作台：达人主数据，作为全项目标准 CRUD 模板。
    saveBase(
      {
        name: 'creators',
        fields: [
          new TextField({ name: 'nickname', required: true, max: 120 }),
          new URLField({ name: 'tiktok_url', required: true }),
          new NumberField({ name: 'followers', required: true, min: 0, onlyInt: true }),
          regionField(),
          new SelectField({
            name: 'cooperation_status',
            required: true,
            maxSelect: 1,
            values: ['pending', 'contacting', 'signed', 'terminated'],
          }),
          new NumberField({ name: 'commission_rate', min: 0, max: 100 }),
          new TextField({ name: 'owner', required: true, max: 40 }),
        ],
        indexes: [
          'CREATE INDEX idx_creators_nickname ON creators (nickname)',
          'CREATE INDEX idx_creators_region_status ON creators (region, cooperation_status)',
        ],
      },
      'business'
    )

    // 商务工作台：客户与供应商名录。
    saveBase(
      {
        name: 'companies',
        fields: [
          new TextField({ name: 'company_name', required: true, max: 160 }),
          new SelectField({ name: 'kind', required: true, maxSelect: 1, values: ['client', 'supplier'] }),
          new TextField({ name: 'contact_name', max: 80 }),
          new EmailField({ name: 'contact_email' }),
          regionField(),
        ],
      },
      'business'
    )

    // 商务工作台：合作跟进看板记录。
    saveBase(
      {
        name: 'cooperation_followups',
        fields: [
          new RelationField({ name: 'creator', required: true, maxSelect: 1, collectionId: app.findCollectionByNameOrId('creators').id, cascadeDelete: true }),
          new SelectField({ name: 'stage', required: true, maxSelect: 1, values: ['pending', 'contacting', 'signed', 'terminated'] }),
          new TextField({ name: 'note', max: 1000 }),
          new DateField({ name: 'next_action_at' }),
          regionField(),
        ],
      },
      'business'
    )

    // 市场工作台：选品库；金额为最小货币单位整数。
    saveBase(
      {
        name: 'products',
        fields: [
          new TextField({ name: 'name', required: true, max: 160 }),
          new TextField({ name: 'category', required: true, max: 80 }),
          new NumberField({ name: 'price_minor', required: true, min: 0, onlyInt: true }),
          new NumberField({ name: 'cost_minor', required: true, min: 0, onlyInt: true }),
          currencyField(),
          regionField(),
          new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['draft', 'testing', 'active', 'paused'] }),
        ],
        indexes: ['CREATE INDEX idx_products_region_status ON products (region, status)'],
      },
      'market'
    )

    // 设计工作台：素材库，文件由 PocketBase 管理。
    saveBase(
      {
        name: 'design_assets',
        fields: [
          new TextField({ name: 'file_name', required: true, max: 180 }),
          new FileField({ name: 'file', required: true, maxSelect: 1, maxSize: 52428800 }),
          new TextField({ name: 'dimensions', max: 40 }),
          regionField(),
        ],
      },
      'design'
    )

    // 设计工作台：设计任务看板。
    saveBase(
      {
        name: 'design_tasks',
        fields: [
          new TextField({ name: 'title', required: true, max: 180 }),
          new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['todo', 'doing', 'review', 'done'] }),
          new DateField({ name: 'due_at' }),
          regionField(),
        ],
      },
      'design'
    )

    // 剪辑工作台：视频生产任务。
    saveBase(
      {
        name: 'video_tasks',
        fields: [
          new TextField({ name: 'title', required: true, max: 180 }),
          new TextField({ name: 'product_name', max: 160 }),
          new TextField({ name: 'creator_name', max: 120 }),
          new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['todo', 'editing', 'review', 'done'] }),
          new DateField({ name: 'due_at' }),
          new TextField({ name: 'owner', required: true, max: 40 }),
          regionField(),
        ],
      },
      'editing'
    )

    // 剪辑工作台：成片归档与在线预览源文件。
    saveBase(
      {
        name: 'videos',
        fields: [
          new TextField({ name: 'title', required: true, max: 180 }),
          new FileField({ name: 'file', required: true, maxSelect: 1, maxSize: 536870912 }),
          new TextField({ name: 'product_name', max: 160 }),
          new TextField({ name: 'creator_name', max: 120 }),
          new DateField({ name: 'publish_at' }),
          regionField(),
        ],
      },
      'editing'
    )

    // 总览工作台：GMV 趋势，金额为最小货币单位整数。
    saveBase(
      {
        name: 'gmv_metrics',
        fields: [
          new DateField({ name: 'metric_date', required: true }),
          new NumberField({ name: 'amount_minor', required: true, min: 0, onlyInt: true }),
          currencyField(),
          regionField(),
        ],
      },
      'boss'
    )

    // 总览工作台：团队成员任务进度。
    saveBase(
      {
        name: 'team_tasks',
        fields: [
          new TextField({ name: 'assignee_name', required: true, max: 40 }),
          new TextField({ name: 'title', required: true, max: 180 }),
          new NumberField({ name: 'progress', required: true, min: 0, max: 100, onlyInt: true }),
          new DateField({ name: 'due_at' }),
          regionField(),
        ],
      },
      'boss'
    )

    // 总览工作台：全公司最近操作记录，只允许系统或老板写入。
    const bossRule = roleRule('boss')
    const auditLogs = new Collection({ type: 'base', name: 'audit_logs' })
    auditLogs.listRule = bossRule
    auditLogs.viewRule = bossRule
    auditLogs.createRule = '@request.auth.id != ""'
    auditLogs.updateRule = null
    auditLogs.deleteRule = null
    auditLogs.fields.add(new TextField({ name: 'actor_name', required: true, max: 40 }))
    auditLogs.fields.add(new TextField({ name: 'action', required: true, max: 240 }))
    auditLogs.fields.add(new TextField({ name: 'entity_type', required: true, max: 80 }))
    auditLogs.fields.add(new TextField({ name: 'entity_id', max: 40 }))
    auditLogs.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    auditLogs.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    auditLogs.indexes = ['CREATE INDEX idx_audit_logs_created ON audit_logs (created DESC)']
    app.save(auditLogs)
  },
  (app) => {
    const names = [
      'audit_logs',
      'team_tasks',
      'gmv_metrics',
      'videos',
      'video_tasks',
      'design_tasks',
      'design_assets',
      'products',
      'cooperation_followups',
      'companies',
      'creators',
    ]
    for (const name of names) {
      app.delete(app.findCollectionByNameOrId(name))
    }
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('role')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  }
)
