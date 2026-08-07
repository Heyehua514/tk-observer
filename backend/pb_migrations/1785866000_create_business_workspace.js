// 商务工作台客户、商机、商单和朋友圈数据；权限：business 与 boss 可读写。
const roleRule = (roles) =>
  `@request.auth.id != "" && (${roles.map((role) => `@request.auth.role = "${role}"`).join(' || ')})`
const text = (name, required = false, max = 5000) =>
  new TextField({ name, required, max })
const select = (name, values, required = true) =>
  new SelectField({ name, values, maxSelect: 1, required })
const relation = (name, collection, required = false) =>
  new RelationField({
    name,
    collectionId: collection.id,
    maxSelect: 1,
    required,
    cascadeDelete: true,
  })
const save = (app, definition) => {
  const collection = new Collection({ type: 'base', name: definition.name })
  const rule = roleRule(['business', 'boss'])
  collection.listRule = rule
  collection.viewRule = rule
  collection.createRule = rule
  collection.updateRule = rule
  collection.deleteRule = rule
  definition.fields.forEach((field) => collection.fields.add(field))
  collection.fields.add(
    new AutodateField({ name: 'created', onCreate: true, onUpdate: false }),
  )
  collection.fields.add(
    new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  )
  app.save(collection)
  return collection
}

migrate(
  (app) => {
    const clients = save(app, {
      name: 'clients',
      fields: [
        text('name', true, 180),
        text('contact_name', false, 80),
        text('contact_phone', false, 40),
        text('contact_wechat', false, 80),
        text('company', false, 180),
        select('industry', [
          'tiktok_service',
          'brand',
          'mcn',
          'supply_chain',
          'ad_agency',
          'other',
        ]),
        select('source', [
          'social',
          'referral',
          'event',
          'outbound',
          'other',
        ]),
        select('level', ['S', 'A', 'B', 'C']),
        text('notes'),
      ],
    })
    const opportunities = save(app, {
      name: 'opportunities',
      fields: [
        relation('client', clients, true),
        text('title', true, 180),
        select('type', [
          'channel_order',
          'event_sponsorship',
          'creator_cooperation',
          'other',
        ]),
        new NumberField({ name: 'amount', min: 0, onlyInt: true }),
        select('stage', [
          'contact',
          'proposal',
          'negotiation',
          'contract',
          'won',
          'lost',
        ]),
        new DateField({ name: 'expected_close' }),
        new NumberField({ name: 'probability', min: 0, max: 100 }),
        text('lost_reason', false, 1000),
        text('notes'),
      ],
    })
    const opportunityWriteRule = `${roleRule(['business', 'boss'])} && (stage != "lost" || lost_reason != "")`
    opportunities.createRule = opportunityWriteRule
    opportunities.updateRule = opportunityWriteRule
    app.save(opportunities)
    save(app, {
      name: 'channel_orders',
      fields: [
        text('title', true, 180),
        relation('client', clients, true),
        relation('creator', app.findCollectionByNameOrId('creators'), true),
        select('platform', ['tiktok', 'wechat_channels', 'douyin', 'youtube']),
        select('content_type', [
          'spoken_placement',
          'unboxing',
          'story_placement',
          'live_commerce',
          'other',
        ]),
        new NumberField({ name: 'amount', min: 0, onlyInt: true }),
        select('status', [
          'negotiating',
          'confirmed',
          'filming',
          'published',
          'completed',
          'cancelled',
        ]),
        new DateField({ name: 'publish_date' }),
        new NumberField({ name: 'actual_views', min: 0, onlyInt: true }),
        new NumberField({ name: 'commission', min: 0, onlyInt: true }),
        text('notes'),
      ],
    })
    save(app, {
      name: 'social_plans',
      fields: [
        new DateField({ name: 'date', required: true }),
        text('content', true, 10000),
        text('target_audience', false, 500),
        text('expected_outcome', false, 1000),
        text('actual_result'),
        relation('linked_opportunity', opportunities),
        select('status', ['planned', 'published', 'reviewed']),
      ],
    })

    const creators = app.findCollectionByNameOrId('creators')
    creators.fields.add(new BoolField({ name: 'is_biz_available' }))
    creators.fields.add(
      new NumberField({ name: 'cooperation_price', min: 0, onlyInt: true }),
    )
    creators.fields.add(text('cooperation_notes'))
    app.save(creators)

    const sponsorships = app.findCollectionByNameOrId('event_sponsorships')
    const collaborationRule = roleRule(['market', 'business', 'boss'])
    sponsorships.listRule = collaborationRule
    sponsorships.viewRule = collaborationRule
    sponsorships.updateRule = collaborationRule
    app.save(sponsorships)
  },
  (app) => {
    const sponsorships = app.findCollectionByNameOrId('event_sponsorships')
    const marketRule = roleRule(['market', 'boss'])
    sponsorships.listRule = marketRule
    sponsorships.viewRule = marketRule
    sponsorships.updateRule = marketRule
    app.save(sponsorships)

    const creators = app.findCollectionByNameOrId('creators')
    ;['is_biz_available', 'cooperation_price', 'cooperation_notes'].forEach(
      (name) => creators.fields.removeByName(name),
    )
    app.save(creators)

    ;['social_plans', 'channel_orders', 'opportunities', 'clients'].forEach(
      (name) => app.delete(app.findCollectionByNameOrId(name)),
    )
  },
)
