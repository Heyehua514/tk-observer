/**
 * 商务工作台：扩展对标账号权限、公众号分析数据和客户行业枚举。
 * 权限：business、boss 可读写公众号文章；editing、business 可读写对标账号。
 * 仅追加新字段、枚举值和 seed，不修改已发布 migration 或已有数据。
 */
const businessRule =
  '@request.auth.id != "" && (@request.auth.role = "business" || @request.auth.role = "boss")'
const competitorRule =
  '@request.auth.id != "" && (@request.auth.role = "editing" || @request.auth.role = "business" || @request.auth.role = "boss")'

migrate(
  (app) => {
    const competitorAccounts = app.findCollectionByNameOrId('competitor_accounts')
    competitorAccounts.listRule = competitorRule
    competitorAccounts.viewRule = competitorRule
    competitorAccounts.createRule = competitorRule
    competitorAccounts.updateRule = competitorRule
    competitorAccounts.deleteRule = competitorRule
    app.save(competitorAccounts)

    for (const [name, category] of [
      ['霞光社', '出海跨境'],
      ['白鲸出海', '出海跨境'],
      ['晚点财经', '科技财经'],
    ]) {
      const existing = app.findRecordsByFilter(
        'competitor_accounts',
        'name = {:name}',
        '',
        1,
        0,
        { name },
      )[0]
      if (existing) continue
      const record = new Record(competitorAccounts)
      record.set('name', name)
      record.set('platform', '微信公众号')
      record.set('category', category)
      record.set('follower_count', 0)
      record.set('avg_views', 0)
      app.save(record)
    }

    const blogArticles = new Collection({ type: 'base', name: 'blog_articles' })
    blogArticles.listRule = businessRule
    blogArticles.viewRule = businessRule
    const clientWriteRule = `${businessRule} && @request.body.is_viral:isset = false`
    blogArticles.createRule = clientWriteRule
    blogArticles.updateRule = clientWriteRule
    blogArticles.deleteRule = businessRule
    blogArticles.fields.add(new TextField({ name: 'title', required: true, max: 200 }))
    blogArticles.fields.add(
      new SelectField({
        name: 'account',
        required: true,
        maxSelect: 1,
        values: ['TK观察', '霞光社', '白鲸出海', '晚点财经'],
      }),
    )
    blogArticles.fields.add(new DateField({ name: 'publish_date', required: true }))
    for (const name of ['views', 'likes', 'shares']) {
      blogArticles.fields.add(new NumberField({ name, min: 0, onlyInt: true }))
    }
    blogArticles.fields.add(new BoolField({ name: 'is_viral' }))
    blogArticles.fields.add(new TextField({ name: 'analysis_notes', max: 10000 }))
    blogArticles.fields.add(new URLField({ name: 'source_url' }))
    blogArticles.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    blogArticles.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    blogArticles.indexes = [
      'CREATE INDEX idx_blog_articles_account_date ON blog_articles (account, publish_date DESC)',
      'CREATE INDEX idx_blog_articles_viral_date ON blog_articles (is_viral, publish_date DESC)',
    ]
    app.save(blogArticles)

    const clients = app.findCollectionByNameOrId('clients')
    const industry = clients.fields.getByName('industry')
    industry.values = Array.from(
      new Set([...industry.values, 'ai_tool', 'creator_tool', 'erp', 'payment', 'finance_tax']),
    )
    app.save(clients)
  },
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    const industry = clients.fields.getByName('industry')
    industry.values = industry.values.filter(
      (value) => !['ai_tool', 'creator_tool', 'erp', 'payment', 'finance_tax'].includes(value),
    )
    app.save(clients)

    const competitorAccounts = app.findCollectionByNameOrId('competitor_accounts')
    competitorAccounts.listRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'
    competitorAccounts.viewRule = competitorAccounts.listRule
    competitorAccounts.createRule = competitorAccounts.listRule
    competitorAccounts.updateRule = competitorAccounts.listRule
    competitorAccounts.deleteRule = competitorAccounts.listRule
    app.save(competitorAccounts)

    for (const name of ['霞光社', '白鲸出海', '晚点财经']) {
      const record = app.findRecordsByFilter(
        'competitor_accounts',
        'name = {:name}',
        '',
        1,
        0,
        { name },
      )[0]
      if (record) app.delete(record)
    }
    app.delete(app.findCollectionByNameOrId('blog_articles'))
  },
)
