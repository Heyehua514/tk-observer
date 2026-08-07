/**
 * 用途：为 users 增加每位成员独立的飞书 OAuth 凭据与同步开关。
 * 权限：token 字段对所有 API 响应隐藏，只允许服务端 hook 读写。
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new TextField({ name: 'feishu_open_id', max: 255 }))
    users.fields.add(
      new TextField({ name: 'feishu_access_token', max: 5000, hidden: true })
    )
    users.fields.add(
      new TextField({ name: 'feishu_refresh_token', max: 5000, hidden: true })
    )
    users.fields.add(new DateField({ name: 'feishu_token_expires_at' }))
    users.fields.add(new DateField({ name: 'feishu_connected_at' }))
    users.fields.add(new BoolField({ name: 'feishu_sync_enabled' }))
    app.save(users)

    const records = app.findAllRecords('users')
    for (const record of records) {
      record.set('feishu_sync_enabled', true)
      app.save(record)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    for (const field of [
      'feishu_open_id',
      'feishu_access_token',
      'feishu_refresh_token',
      'feishu_token_expires_at',
      'feishu_connected_at',
      'feishu_sync_enabled',
    ]) {
      users.fields.removeByName(field)
    }
    app.save(users)
  }
)
