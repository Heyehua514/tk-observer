/**
 * 飞书 OAuth 交换；权限：Supabase Auth 用户；用途：服务端保存加密 token，不向浏览器返回凭据。
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  buildTokenExchangeRequest,
  encryptToken,
  redactConnection,
  requireOAuthConfig,
  validateOAuthRequest,
} from './core.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405)

  const authorization = request.headers.get('Authorization') || ''
  if (!authorization.startsWith('Bearer ')) return json({ code: 'AUTH_REQUIRED' }, 401)

  try {
    const config = requireOAuthConfig(Deno.env.toObject())
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_NOT_CONFIGURED')

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ code: 'AUTH_REQUIRED' }, 401)

    const { code } = validateOAuthRequest(await request.json())
    const appResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
    })
    const appBody = await appResponse.json()
    if (!appResponse.ok || Number(appBody.code || 0) !== 0 || !appBody.app_access_token) {
      throw new Error('APP_TOKEN_EXCHANGE_FAILED')
    }

    const exchange = buildTokenExchangeRequest(appBody.app_access_token, code)
    const tokenResponse = await fetch(exchange.url, {
      method: 'POST',
      headers: exchange.headers,
      body: JSON.stringify(exchange.body),
    })
    const tokenBody = await tokenResponse.json()
    const token = tokenBody.data || tokenBody
    if (!tokenResponse.ok || Number(tokenBody.code || 0) !== 0 || !token.access_token || !token.refresh_token) {
      throw new Error('USER_TOKEN_EXCHANGE_FAILED')
    }

    const connectedAt = new Date().toISOString()
    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: saved, error: saveError } = await admin
      .from('feishu_connections')
      .upsert({
        user_id: userData.user.id,
        open_id: String(token.open_id || ''),
        access_token_encrypted: await encryptToken(String(token.access_token), config.encryptionKey),
        refresh_token_encrypted: await encryptToken(String(token.refresh_token), config.encryptionKey),
        token_expires_at: new Date(Date.now() + Number(token.expires_in || 0) * 1000).toISOString(),
        connected_at: connectedAt,
        sync_enabled: true,
        consecutive_failures: 0,
      })
      .select('connected_at,sync_enabled,last_synced_at,consecutive_failures')
      .single()
    if (saveError) throw new Error('CONNECTION_SAVE_FAILED')
    return json(redactConnection(saved))
  } catch (error) {
    const code = error instanceof Error ? error.message : 'FEISHU_OAUTH_FAILED'
    const status = code === 'AUTH_REQUIRED' ? 401 : code === 'FEISHU_NOT_CONFIGURED' || code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 502
    console.error(JSON.stringify({ event: 'feishu_oauth_failed', code }))
    return json({ code }, status)
  }
})
