/** AI 代理纯函数：配置解析、请求构造与响应提取，供 Deno 入口与 Node 测试共用。 */

export const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com/v1'
export const DEFAULT_AI_MODEL = 'deepseek-chat'
export const MAX_PROMPT_CHARS = 200000

export function resolveAiConfig(env) {
  const baseUrl = String(
    env.AI_BASE_URL || env.AI_API_BASE || env.DEEPSEEK_BASE_URL || DEFAULT_AI_BASE_URL
  ).replace(/\/+$/, '')
  const apiKey = String(env.AI_API_KEY || env.DEEPSEEK_API_KEY || '').trim()
  const model = String(env.AI_MODEL || env.DEEPSEEK_MODEL || DEFAULT_AI_MODEL).trim()
  if (!apiKey || !baseUrl || !model) throw new Error('AI_NOT_CONFIGURED')
  if (!/^https:\/\//.test(baseUrl)) throw new Error('AI_BASE_URL_INVALID')
  return { baseUrl, apiKey, model }
}

export function buildChatPayload(prompt, model, maxTokens = 4096) {
  const content = String(prompt || '').trim()
  if (!content) throw new Error('EMPTY_PROMPT')
  if (content.length > MAX_PROMPT_CHARS) throw new Error('PROMPT_TOO_LARGE')
  return {
    model,
    messages: [
      {
        role: 'system',
        content: '你是 TK观察工作台的企业内部助手，回答必须具体、可执行，使用简体中文。',
      },
      { role: 'user', content },
    ],
    stream: false,
    max_tokens: maxTokens,
    temperature: 0.4,
  }
}

export function extractChatText(payload) {
  const text = payload?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw new Error('AI_EMPTY_RESPONSE')
  return text
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}