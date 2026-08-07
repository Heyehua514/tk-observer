/**
 * 用途：保存每位成员可访问的飞书文档及增量同步游标。
 * 权限：成员只能读取自己的文档与状态，全部写入仅允许服务端 hook。
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const ownDocument =
      '@request.auth.id != "" && owner_user = @request.auth.id'
    const ownState = '@request.auth.id != "" && user = @request.auth.id'

    const documents = new Collection({ type: 'base', name: 'feishu_documents' })
    documents.listRule = ownDocument
    documents.viewRule = ownDocument
    documents.createRule = null
    documents.updateRule = null
    documents.deleteRule = null
    documents.fields.add(
      new RelationField({
        name: 'owner_user',
        required: true,
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: true,
      })
    )
    documents.fields.add(
      new SelectField({ name: 'source_type', required: true, maxSelect: 1, values: ['doc', 'wiki', 'bitable'] })
    )
    documents.fields.add(new URLField({ name: 'source_url', required: true }))
    documents.fields.add(new TextField({ name: 'source_title', max: 500 }))
    documents.fields.add(new TextField({ name: 'raw_content', max: 50000 }))
    documents.fields.add(new TextField({ name: 'author_name', max: 255 }))
    documents.fields.add(new DateField({ name: 'feishu_updated_at' }))
    documents.fields.add(
      new SelectField({ name: 'access_scope', required: true, maxSelect: 1, values: ['public', 'internal', 'restricted'] })
    )
    documents.fields.add(
      new SelectField({ name: 'sync_status', required: true, maxSelect: 1, values: ['pending', 'processed', 'failed'] })
    )
    documents.fields.add(new DateField({ name: 'synced_at', required: true }))
    documents.indexes = [
      'CREATE UNIQUE INDEX idx_feishu_documents_owner_url ON feishu_documents (owner_user, source_url)',
      'CREATE INDEX idx_feishu_documents_owner_updated ON feishu_documents (owner_user, feishu_updated_at DESC)',
    ]
    app.save(documents)

    const states = new Collection({ type: 'base', name: 'feishu_sync_state' })
    states.listRule = ownState
    states.viewRule = ownState
    states.createRule = null
    states.updateRule = null
    states.deleteRule = null
    states.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: true,
      })
    )
    states.fields.add(
      new SelectField({ name: 'source_type', required: true, maxSelect: 1, values: ['doc', 'wiki', 'bitable'] })
    )
    states.fields.add(new TextField({ name: 'last_cursor', max: 2000 }))
    states.fields.add(new DateField({ name: 'last_synced_at' }))
    states.fields.add(new NumberField({ name: 'consecutive_failures', min: 0, onlyInt: true }))
    states.indexes = [
      'CREATE UNIQUE INDEX idx_feishu_sync_state_user_type ON feishu_sync_state (user, source_type)',
    ]
    app.save(states)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('feishu_sync_state'))
    app.delete(app.findCollectionByNameOrId('feishu_documents'))
  }
)
