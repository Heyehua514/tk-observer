/**
 * 飞书 OAuth 纯逻辑；权限：Edge Function 内部调用；用途：校验输入、加密 token、脱敏响应。
 */

export function validateOAuthRequest(body) {
  const code = String(body?.code || '').trim()
  if (!code || code.length > 2048) {
    throw new Error('INVALID_CODE')
  }
  return { code }
}

export function requireOAuthConfig(env) {
  const appId = String(env.FEISHU_APP_ID || '').trim()
  const appSecret = String(env.FEISHU_APP_SECRET || '').trim()
  const encryptionKey = String(env.FEISHU_TOKEN_ENCRYPTION_KEY || '')
  if (!appId || !appSecret || encryptionKey.length !== 32) {
    throw new Error('FEISHU_NOT_CONFIGURED')
  }
  return { appId, appSecret, encryptionKey }
}

export function buildTokenExchangeRequest(appAccessToken, code) {
  return {
    url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: { grant_type: 'authorization_code', code },
  }
}

function toBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function encryptToken(value, keyText, cryptoApi = globalThis.crypto) {
  const keyBytes = new TextEncoder().encode(keyText)
  const key = await cryptoApi.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  const iv = cryptoApi.getRandomValues(new Uint8Array(12))
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value)
  )
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`
}

export function redactConnection(row) {
  return {
    connected: true,
    connected_at: row.connected_at,
    sync_enabled: row.sync_enabled !== false,
    last_synced_at: row.last_synced_at || null,
    consecutive_failures: row.consecutive_failures || 0,
  }
}
