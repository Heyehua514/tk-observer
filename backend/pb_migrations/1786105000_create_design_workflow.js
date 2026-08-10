/**
 * 设计工作台：需求接收、视觉参考和交付记录。
 * 权限：boss/business 提需求，design 处理；交付对需求方只读。
 */
const roleRule = (roles) =>
  `@request.auth.id != "" && (${roles.map((role) => `@request.auth.role = "${role}"`).join(' || ')})`
const text = (name, max, required = false) =>
  new TextField({ name, max, required })
const relation = (name, collection, required = true) =>
  new RelationField({
    name,
    collectionId: collection.id,
    maxSelect: 1,
    required,
    cascadeDelete: false,
  })
const timestamps = (collection) => {
  collection.fields.add(
    new AutodateField({ name: 'created', onCreate: true, onUpdate: false }),
  )
  collection.fields.add(
    new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
  )
}

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const assets = app.findCollectionByNameOrId('design_assets')
    const allRoles = roleRule(['boss', 'business', 'design'])
    const requesterRoles = roleRule(['boss', 'business'])
    const designerRole = roleRule(['design'])

    const requirements = new Collection({
      type: 'base',
      name: 'design_requirements',
    })
    requirements.listRule = allRoles
    requirements.viewRule = allRoles
    const statusOnly =
      '@request.body.title:isset = false && ' +
      '@request.body.description:isset = false && ' +
      '@request.body.requester:isset = false && ' +
      '@request.body.target_size:isset = false && ' +
      '@request.body.usage_scene:isset = false && ' +
      '@request.body.copy_content:isset = false && ' +
      '@request.body.delivery_format:isset = false && ' +
      '@request.body.reference_urls:isset = false && ' +
      '@request.body.priority:isset = false && ' +
      '@request.body.due_date:isset = false'
    requirements.createRule =
      `${requesterRoles} && requester = @request.auth.id && ` +
      '@request.body.status = "pending"'
    const designerTransition =
      '@request.auth.id != "" && @request.auth.role = "design" && (' +
      '(status = "pending" && @request.body.status = "in_progress") || ' +
      '(status = "in_progress" && @request.body.status = "delivered") || ' +
      '(status = "revised" && @request.body.status = "in_progress"))'
    const requesterRevision =
      '@request.auth.id != "" && ' +
      '(@request.auth.role = "boss" || @request.auth.role = "business") && ' +
      'status = "delivered" && @request.body.status = "revised"'
    requirements.updateRule =
      `((${designerTransition}) || (${requesterRevision})) && ${statusOnly}`
    requirements.deleteRule = null
    requirements.fields.add(text('title', 200, true))
    requirements.fields.add(text('description', 5000, true))
    requirements.fields.add(relation('requester', users))
    requirements.fields.add(text('target_size', 80, true))
    requirements.fields.add(text('usage_scene', 200, true))
    requirements.fields.add(text('copy_content', 5000, true))
    requirements.fields.add(text('delivery_format', 80, true))
    requirements.fields.add(text('reference_urls', 2000))
    requirements.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['pending', 'in_progress', 'delivered', 'revised'],
      }),
    )
    requirements.fields.add(
      new SelectField({
        name: 'priority',
        required: true,
        maxSelect: 1,
        values: ['高', '中', '低'],
      }),
    )
    requirements.fields.add(new DateField({ name: 'due_date', required: true }))
    timestamps(requirements)
    requirements.indexes = [
      'CREATE INDEX idx_design_requirements_status_due ON design_requirements (status, due_date)',
    ]
    app.save(requirements)

    const references = new Collection({
      type: 'base',
      name: 'design_references',
    })
    references.listRule = designerRole
    references.viewRule = designerRole
    references.createRule = designerRole
    references.updateRule = designerRole
    references.deleteRule = designerRole
    references.fields.add(relation('requirement', requirements))
    references.fields.add(new URLField({ name: 'image_url', required: true }))
    references.fields.add(text('source', 200))
    references.fields.add(text('notes', 1000))
    timestamps(references)
    app.save(references)

    const deliverables = new Collection({
      type: 'base',
      name: 'design_deliverables',
    })
    deliverables.listRule = allRoles
    deliverables.viewRule = allRoles
    deliverables.createRule = designerRole
    deliverables.updateRule = designerRole
    deliverables.deleteRule = designerRole
    deliverables.fields.add(relation('requirement', requirements))
    deliverables.fields.add(relation('asset', assets))
    deliverables.fields.add(text('exported_size', 40, true))
    deliverables.fields.add(text('exported_format', 20, true))
    deliverables.fields.add(new BoolField({ name: 'checklist_ok' }))
    deliverables.fields.add(new DateField({ name: 'delivered_at', required: true }))
    timestamps(deliverables)
    app.save(deliverables)
  },
  (app) => {
    for (const name of [
      'design_deliverables',
      'design_references',
      'design_requirements',
    ]) app.delete(app.findCollectionByNameOrId(name))
  },
)
