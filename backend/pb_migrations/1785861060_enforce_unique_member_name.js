/**
 * 认证模块：保证同一公司成员姓名只能绑定一个 users 账号。
 * 该数据库唯一索引是注册 hook 中“先查询再创建”之外的并发安全边界。
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.indexes = [
      ...users.indexes,
      "CREATE UNIQUE INDEX idx_users_member_name ON users (name) WHERE name != ''",
    ]
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.indexes = users.indexes.filter(
      (index) => !index.includes('idx_users_member_name')
    )
    app.save(users)
  }
)
