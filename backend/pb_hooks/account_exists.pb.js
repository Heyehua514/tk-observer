/**
 * 登录错误辅助端点。
 * PocketBase 标准密码认证会统一返回 400；本端点只返回账号是否存在，
 * 让内部五人系统按产品要求区分“账号不存在”和“密码错误”。
 */
routerAdd('GET', '/api/tk-observer/account-exists', (event) => {
  const email = String(event.request.url.query().get('email') || '').trim().toLowerCase()
  if (!email) {
    return event.json(400, { exists: false })
  }

  try {
    $app.findAuthRecordByEmail('users', email)
    return event.json(200, { exists: true })
  } catch (_) {
    return event.json(200, { exists: false })
  }
})

