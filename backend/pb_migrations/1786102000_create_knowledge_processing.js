/**
 * 用途：创建飞书文档切片与服务端生成的结构化知识摘要数据层。
 * 所属工作台：知识库。
 * 权限：所有登录用户可读；仅服务端 hooks 可写。
 */
migrate(
  (app) => {
    const authenticated = '@request.auth.id != ""'
    const documents = app.findCollectionByNameOrId('feishu_documents')

    const snippets = new Collection({ type: 'base', name: 'knowledge_snippets' })
    snippets.listRule = authenticated
    snippets.viewRule = authenticated
    snippets.createRule = null
    snippets.updateRule = null
    snippets.deleteRule = null
    snippets.fields.add(
      new RelationField({
        name: 'document',
        collectionId: documents.id,
        maxSelect: 1,
        required: true,
        cascadeDelete: true,
      })
    )
    snippets.fields.add(
      new NumberField({ name: 'chunk_index', min: 0, onlyInt: true, required: true })
    )
    snippets.fields.add(
      new TextField({ name: 'content', required: true, max: 4000 })
    )
    snippets.fields.add(new DateField({ name: 'processed_at', required: true }))
    snippets.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    snippets.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    snippets.indexes = [
      'CREATE UNIQUE INDEX idx_knowledge_snippets_document_chunk ON knowledge_snippets (document, chunk_index)',
    ]
    app.save(snippets)

    const summaries = new Collection({ type: 'base', name: 'smart_summaries' })
    summaries.listRule = authenticated
    summaries.viewRule = authenticated
    summaries.createRule = null
    summaries.updateRule = null
    summaries.deleteRule = null
    summaries.fields.add(
      new RelationField({
        name: 'snippet',
        collectionId: snippets.id,
        maxSelect: 1,
        required: true,
        cascadeDelete: true,
      })
    )
    summaries.fields.add(
      new TextField({ name: 'summary', required: true, max: 10000 })
    )
    for (const name of [
      'decisions',
      'action_items',
      'risks',
      'sops',
      'failed_lessons',
      'quote_snippets',
    ]) {
      summaries.fields.add(new JSONField({ name, required: true, maxSize: 50000 }))
    }
    summaries.fields.add(
      new NumberField({
        name: 'quality_score',
        min: 0,
        max: 100,
        required: true,
      })
    )
    summaries.fields.add(
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false })
    )
    summaries.fields.add(
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
    )
    summaries.indexes = [
      'CREATE UNIQUE INDEX idx_smart_summaries_snippet ON smart_summaries (snippet)',
    ]
    app.save(summaries)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('smart_summaries'))
    app.delete(app.findCollectionByNameOrId('knowledge_snippets'))
  }
)
