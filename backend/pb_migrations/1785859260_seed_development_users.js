/**
 * 本地开发账号种子。
 * 这些密码仅供本地联调，生产环境部署前必须删除账号或立即修改密码。
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const accounts = [
      ['磊哥', 'boss@tkobserver.local', 'boss', 'TkBoss@2026!'],
      ['董雨辰', 'business@tkobserver.local', 'business', 'TkBusiness@2026!'],
      ['韩素云', 'market@tkobserver.local', 'market', 'TkMarket@2026!'],
      ['孙铭泽', 'design@tkobserver.local', 'design', 'TkDesign@2026!'],
      ['谢洁', 'editing@tkobserver.local', 'editing', 'TkEditing@2026!'],
    ]

    for (const [name, email, role, password] of accounts) {
      const record = new Record(users)
      record.set('name', name)
      record.set('email', email)
      record.set('role', role)
      record.set('verified', true)
      record.setPassword(password)
      app.save(record)
    }
  },
  (app) => {
    const emails = [
      'boss@tkobserver.local',
      'business@tkobserver.local',
      'market@tkobserver.local',
      'design@tkobserver.local',
      'editing@tkobserver.local',
    ]
    for (const email of emails) {
      try {
        app.delete(app.findAuthRecordByEmail('users', email))
      } catch (_) {
        // Rollback is idempotent when a seed record was already removed.
      }
    }
  }
)

