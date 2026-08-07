/**
 * 用途：将当前登录成员的飞书 OAuth 授权码交换为加密 token。
 * 权限：端点必须登录且 userId 必须等于当前 auth.id；token 永不返回客户端。
 */
onRecordCreate((event) => {
  if (event.record.get('feishu_sync_enabled') === false) {
    event.record.set('feishu_sync_enabled', true)
  }
  event.next()
}, 'users')

routerAdd('POST', '/api/tk-observer/feishu/exchange-token', (event) => {
  if (!event.auth || !event.auth.id) {
    return event.json(401, { code: 'AUTH_REQUIRED', message: 'authentication required' })
  }
  const body = event.requestInfo().body || {}
  const code = String(body.code || '').trim()
  const userId = String(body.userId || '').trim()
  if (userId !== event.auth.id) {
    return event.json(403, { code: 'USER_MISMATCH', message: 'userId must match current user' })
  }
  if (!code) {
    return event.json(400, { code: 'INVALID_CODE', message: 'authorization code is required' })
  }

  const appId = String($os.getenv('FEISHU_APP_ID') || '')
  const appSecret = String($os.getenv('FEISHU_APP_SECRET') || '')
  const encryptionKey = String($os.getenv('FEISHU_TOKEN_ENCRYPTION_KEY') || '')
  if (!appId || !appSecret || encryptionKey.length !== 32) {
    return event.json(503, { code: 'FEISHU_NOT_CONFIGURED', message: 'Feishu OAuth is not configured' })
  }

  try {
    const appResponse = $http.send({
      url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: { app_id: appId, app_secret: appSecret },
      timeout: 30,
    })
    const appBody = appResponse.json || {}
    if (appResponse.statusCode < 200 || appResponse.statusCode >= 300 || Number(appBody.code || 0) !== 0 || !appBody.app_access_token) {
      throw new Error('app_access_token exchange failed')
    }

    const tokenResponse = $http.send({
      url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appBody.app_access_token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: { grant_type: 'authorization_code', code },
      timeout: 30,
    })
    const tokenBody = tokenResponse.json || {}
    const token = tokenBody.data || tokenBody
    if (tokenResponse.statusCode < 200 || tokenResponse.statusCode >= 300 || Number(tokenBody.code || 0) !== 0 || !token.access_token || !token.refresh_token) {
      throw new Error('user access_token exchange failed')
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + Number(token.expires_in || 0) * 1000)
    const user = $app.findRecordById('users', userId)
    user.set('feishu_open_id', String(token.open_id || ''))
    user.set('feishu_access_token', $security.encrypt(String(token.access_token), encryptionKey))
    user.set('feishu_refresh_token', $security.encrypt(String(token.refresh_token), encryptionKey))
    user.set('feishu_token_expires_at', expiresAt.toISOString())
    user.set('feishu_connected_at', now.toISOString())
    user.set('feishu_sync_enabled', true)
    $app.save(user)
    return event.json(200, { connected: true, userId, openId: String(token.open_id || '') })
  } catch (error) {
    console.log(JSON.stringify({ event: 'feishu_token_exchange_failed', userId, message: String(error) }))
    return event.json(502, { code: 'FEISHU_TOKEN_EXCHANGE_FAILED', message: 'Feishu token exchange failed' })
  }
})
