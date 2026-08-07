// 市场活动共享关系补全；权限：market、boss，招商记录允许 business 读取和更新。
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const venues = app.findCollectionByNameOrId('venues')
    const events = app.findCollectionByNameOrId('events')
    const tasks = app.findCollectionByNameOrId('event_tasks')
    const materials = app.findCollectionByNameOrId('event_materials')
    const sponsorships = app.findCollectionByNameOrId('event_sponsorships')

    events.fields.add(
      new RelationField({
        name: 'venue',
        collectionId: venues.id,
        maxSelect: 1,
      })
    )
    events.fields.add(
      new RelationField({
        name: 'created_by',
        collectionId: users.id,
        maxSelect: 1,
      })
    )
    tasks.fields.add(
      new RelationField({
        name: 'assignee',
        collectionId: users.id,
        maxSelect: 1,
      })
    )
    materials.fields.add(
      new RelationField({
        name: 'designer',
        collectionId: users.id,
        maxSelect: 1,
      })
    )
    sponsorships.listRule =
      '@request.auth.id != "" && (@request.auth.role = "market" || @request.auth.role = "boss" || @request.auth.role = "business")'
    sponsorships.viewRule = sponsorships.listRule
    sponsorships.updateRule = sponsorships.listRule

    app.save(events)
    app.save(tasks)
    app.save(materials)
    app.save(sponsorships)
  },
  (app) => {
    const events = app.findCollectionByNameOrId('events')
    const tasks = app.findCollectionByNameOrId('event_tasks')
    const materials = app.findCollectionByNameOrId('event_materials')
    const sponsorships = app.findCollectionByNameOrId('event_sponsorships')
    events.fields.removeByName('venue')
    events.fields.removeByName('created_by')
    tasks.fields.removeByName('assignee')
    materials.fields.removeByName('designer')
    sponsorships.listRule =
      '@request.auth.id != "" && (@request.auth.role = "market" || @request.auth.role = "boss")'
    sponsorships.viewRule = sponsorships.listRule
    sponsorships.updateRule = sponsorships.listRule
    app.save(events)
    app.save(tasks)
    app.save(materials)
    app.save(sponsorships)
  }
)
