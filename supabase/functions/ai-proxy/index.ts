/**
 * 企业 AI 代理；权限：Supabase Auth 用户；用途：无本机 WorkBuddy 的设备通过云端调用 DeepSeek，
 * 不向浏览器暴露 API Key。
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  buildChatPayload,
  corsHeaders,
  extractChatText,
  resolveAiConfig,
} from './core.mjs'

const REQUEST_TIMEOUT_MS = 120000

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function errorCode(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ''
  return /^[A-Z_]+$/.test(message) ? message : fallback
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)

  const authorization = request.headers.get('Authorization') || ''
  if (!authorization.startsWith('Bearer ')) return json({ ok: false, error: 'AUTH_REQUIRED' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  if (!supabaseUrl || !anonKey) return json({ ok: false, error: 'SUPABASE_NOT_CONFIGURED' }, 500)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ ok: false, error: 'AUTH_REQUIRED' }, 401)

  try {
    const config = resolveAiConfig(Deno.env.toObject())
    const payload = (await request.json()) as { prompt?: unknown }
    const body = buildChatPayload(String(payload.prompt || ''), config.model)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('AI_UPSTREAM_FAILED', response.status, detail.slice(0, 300))
      return json({ ok: false, error: 'AI_UPSTREAM_FAILED' }, 502)
    }

    const text = extractChatText(await response.json())
    return json({ ok: true, text, channel: 'cloud', model: config.model })
  } catch (error) {
    const code = errorCode(error, 'AI_PROXY_FAILED')
    const status = code === 'AI_NOT_CONFIGURED' ? 503 : 400
    return json({ ok: false, error: code }, status)
  }
})