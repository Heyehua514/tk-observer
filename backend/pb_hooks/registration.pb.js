/**
 * 内部成员自助注册端点。
 * 姓名与角色映射只由服务端决定；同一成员只能注册一次。
 */
routerAdd('POST', '/api/tk-observer/register', (event) => {
  const memberRoles = {
    '磊哥': 'boss',
    '董雨辰': 'business',
    '韩素云': 'market',
    '孙铭泽': 'design',
    '谢洁': 'editing',
    '杨振康': 'business',
  }
  const body = event.requestInfo().body
  const email = String(body.email || '').trim().toLowerCase()
  const memberName = String(body.memberName || '').trim()
  const password = String(body.password || '')
  const passwordConfirm = String(body.passwordConfirm || '')
  const role = memberRoles[memberName]

  if (!role) {
    return event.json(400, { code: 'INVALID_MEMBER', message: '请选择公司成员' })
  }
  if (!email || password.length < 8 || password !== passwordConfirm) {
    return event.json(400, { code: 'INVALID_INPUT', message: '注册信息不符合要求' })
  }

  try {
    $app.findAuthRecordByEmail('users', email)
    return event.json(400, { code: 'EMAIL_REGISTERED', message: '该邮箱已注册' })
  } catch (_) {
    // The email is available.
  }

  try {
    $app.findFirstRecordByFilter('users', 'name = {:name}', { name: memberName })
    return event.json(400, { code: 'MEMBER_REGISTERED', message: '该成员已注册' })
  } catch (_) {
    // The member slot is available.
  }

  try {
    const users = $app.findCollectionByNameOrId('users')
    const record = new Record(users)
    record.set('name', memberName)
    record.set('email', email)
    record.set('role', role)
    record.set('verified', true)
    record.setPassword(password)
    $app.save(record)

    return event.json(201, {
      id: record.id,
      email,
      name: memberName,
      role,
    })
  } catch (_) {
    return event.json(400, { code: 'INVALID_INPUT', message: '无法创建账号' })
  }
})
