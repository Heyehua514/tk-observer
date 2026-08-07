// 市场工作台共享活动与场地数据；权限：market 可写，boss 可读写。
const roleRule = (roles) => `@request.auth.id != "" && (${roles.map((role) => `@request.auth.role = "${role}"`).join(' || ')})`
const relation = (name, collection, required = false) => new RelationField({ name, collectionId: collection.id, maxSelect: 1, required, cascadeDelete: true })
const text = (name, required = false, max = 5000) => new TextField({ name, required, max })
const select = (name, values, required = true) => new SelectField({ name, values, maxSelect: 1, required })
const save = (app, definition) => {
  const collection = new Collection({ type: 'base', name: definition.name })
  collection.listRule = roleRule(['market', 'boss'])
  collection.viewRule = roleRule(['market', 'boss'])
  collection.createRule = roleRule(['market', 'boss'])
  collection.updateRule = roleRule(['market', 'boss'])
  collection.deleteRule = roleRule(['market', 'boss'])
  definition.fields.forEach((field) => collection.fields.add(field))
  collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
  collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
  app.save(collection)
  return collection
}

migrate((app) => {
  const events = save(app, { name: 'events', fields: [text('name', true, 180), select('type', ['closed_salon', 'private_dinner', 'annual_summit', 'global_study_tour']), text('theme', false, 500), new DateField({ name: 'start_date', required: true }), text('location_city', true, 80), new NumberField({ name: 'target_attendees', min: 0, onlyInt: true }), new NumberField({ name: 'target_sponsorship', min: 0, onlyInt: true }), new NumberField({ name: 'total_budget', min: 0, onlyInt: true }), select('status', ['preparing', 'sponsoring', 'scheduled', 'ongoing', 'ended', 'reviewed'])] })
  const phases = save(app, { name: 'event_phases', fields: [relation('event', events, true), text('name', true, 120), new NumberField({ name: 'phase_order', min: 0, max: 4, onlyInt: true }), new DateField({ name: 'start_date' }), new DateField({ name: 'end_date' }), select('status', ['not_started', 'in_progress', 'completed']), new NumberField({ name: 'completion_pct', min: 0, max: 100 })] })
  save(app, { name: 'event_tasks', fields: [relation('event', events, true), relation('phase', phases, true), text('title', true, 180), select('assignee_role', ['boss', 'business', 'market', 'design', 'editing']), select('status', ['todo', 'in_progress', 'done', 'blocked']), select('priority', ['high', 'medium', 'low']), new DateField({ name: 'due_date' }), text('notes')] })
  save(app, { name: 'venues', fields: [text('name', true, 180), select('type', ['hotel', 'club', 'industrial_park', 'creative_space', 'study_destination']), text('city', true, 80), text('address'), new NumberField({ name: 'capacity_min', min: 0, onlyInt: true }), new NumberField({ name: 'capacity_max', min: 0, onlyInt: true }), text('price_range', false, 120), text('scene_tags', false, 1000), text('pros'), text('cons'), text('contact_name', false, 80), text('contact_phone', false, 40), new DateField({ name: 'site_visit_date' }), text('site_visit_notes'), new FileField({ name: 'photos', maxSelect: 10, maxSize: 52428800 }), new BoolField({ name: 'is_verified' }), new NumberField({ name: 'usage_count', min: 0, onlyInt: true })] })
  save(app, { name: 'event_registrations', fields: [relation('event', events, true), text('name', true, 80), text('company', false, 160), text('position', false, 80), select('channel', ['referral', 'activity', '朋友圈', '主动邀请', 'other']), select('confirmation_status', ['pending', 'confirmed', 'cancelled']), select('payment_status', ['unpaid', 'paid', 'waived'])] })
  save(app, { name: 'event_sponsorships', fields: [relation('event', events, true), relation('client', app.findCollectionByNameOrId('companies')), text('contact_name', false, 80), new NumberField({ name: 'amount', min: 0, onlyInt: true }), select('stage', ['intent', 'negotiating', 'signed', 'lost']), text('notes')] })
  save(app, { name: 'event_templates', fields: [text('name', true, 180), select('type', ['invitation', 'external_copy', 'poster_copy', 'review_report', 'sop']), select('event_type', ['closed_salon', 'private_dinner', 'annual_summit', 'global_study_tour', 'general']), text('content', true, 50000), text('tags', false, 1000), new NumberField({ name: 'usage_count', min: 0, onlyInt: true }), new DateField({ name: 'last_used_at' })] })
  save(app, { name: 'event_materials', fields: [relation('event', events), select('type', ['key_visual', 'poster', 'invitation', 'check_in', 'table_card', 'agenda', 'thank_you']), text('name', true, 180), new FileField({ name: 'file', maxSelect: 1, maxSize: 52428800 }), select('status', ['designing', 'pending_review', 'confirmed', 'printed']), text('notes')] })
  save(app, { name: 'event_finances', fields: [relation('event', events, true), select('category', ['sponsorship_income', 'ticket_income', 'venue', 'setup', 'catering', 'printing', 'travel', 'other']), select('type', ['income', 'expense']), new NumberField({ name: 'amount', min: 0, onlyInt: true }), text('description', true, 500), text('paid_by', false, 80), new DateField({ name: 'paid_at' }), new FileField({ name: 'receipt', maxSelect: 1, maxSize: 10485760 })] })
}, (app) => {
  ;['event_finances', 'event_materials', 'event_templates', 'event_sponsorships', 'event_registrations', 'venues', 'event_tasks', 'event_phases', 'events'].forEach((name) => {
    const collection = app.findCollectionByNameOrId(name)
    if (collection) app.delete(collection)
  })
})
