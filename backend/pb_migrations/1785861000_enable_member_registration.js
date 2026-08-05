/**
 * 认证模块：切换为成员自助注册。
 * 精确移除上一个 migration 创建的五个开发种子账号，不开放 users Collection 的公共 createRule。
 * 真实注册继续由 pb_hooks/registration.pb.js 校验成员白名单并赋予角色。
 */
migrate(
  (app) => {
    const seededEmails = [
      'boss@tkobserver.local',
      'business@tkobserver.local',
      'market@tkobserver.local',
      'design@tkobserver.local',
      'editing@tkobserver.local',
    ]

    for (const email of seededEmails) {
      try {
        app.delete(app.findAuthRecordByEmail('users', email))
      } catch (_) {
        // Migration remains idempotent if a development account was already removed.
      }
    }
  },
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
  }
)
