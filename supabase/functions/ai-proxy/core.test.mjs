import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildChatPayload,
  corsHeaders,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  extractChatText,
  MAX_PROMPT_CHARS,
  resolveAiConfig,
} from './core.mjs'

test('resolves deepseek config from generic or provider-specific env keys', () => {
  assert.deepEqual(
    resolveAiConfig({ AI_API_KEY: ' key-1 ', AI_MODEL: ' deepseek-reasoner ' }),
    { baseUrl: DEFAULT_AI_BASE_URL, apiKey: 'key-1', model: 'deepseek-reasoner' }
  )
  assert.deepEqual(resolveAiConfig({ DEEPSEEK_API_KEY: 'key-2' }), {
    baseUrl: DEFAULT_AI_BASE_URL,
    apiKey: 'key-2',
    model: DEFAULT_AI_MODEL,
  })
})

test('rejects missing keys, insecure base urls and empty models', () => {
  assert.throws(() => resolveAiConfig({}), /AI_NOT_CONFIGURED/)
  assert.throws(() => resolveAiConfig({ AI_API_KEY: ' ', AI_MODEL: 'deepseek-chat' }), /AI_NOT_CONFIGURED/)
  assert.throws(() => resolveAiConfig({ AI_API_KEY: 'k', AI_MODEL: '   ' }), /AI_NOT_CONFIGURED/)
  assert.throws(
    () => resolveAiConfig({ DEEPSEEK_API_KEY: 'k', DEEPSEEK_BASE_URL: 'k' }),
    /AI_BASE_URL_INVALID/
  )
  assert.throws(
    () => resolveAiConfig({ AI_API_KEY: 'k', AI_BASE_URL: 'http://api.deepseek.com/v1' }),
    /AI_BASE_URL_INVALID/
  )
})

test('normalizes trailing slashes in the base url', () => {
  const config = resolveAiConfig({ AI_API_KEY: 'k', AI_BASE_URL: 'https://proxy.example.com/v1///' })
  assert.equal(config.baseUrl, 'https://proxy.example.com/v1')
})

test('builds a non-streaming chat payload with the requested model', () => {
  const payload = buildChatPayload('  分析这个账号  ', 'deepseek-chat', 1024)
  assert.equal(payload.model, 'deepseek-chat')
  assert.equal(payload.stream, false)
  assert.equal(payload.max_tokens, 1024)
  assert.equal(payload.messages.length, 2)
  assert.equal(payload.messages[0].role, 'system')
  assert.equal(payload.messages[1].content, '分析这个账号')
})

test('rejects empty and oversized prompts', () => {
  assert.throws(() => buildChatPayload('   ', 'deepseek-chat'), /EMPTY_PROMPT/)
  assert.throws(
    () => buildChatPayload('x'.repeat(MAX_PROMPT_CHARS + 1), 'deepseek-chat'),
    /PROMPT_TOO_LARGE/
  )
})

test('extracts assistant text and rejects empty completions', () => {
  assert.equal(
    extractChatText({ choices: [{ message: { content: '结论' } }] }),
    '结论'
  )
  assert.throws(() => extractChatText({ choices: [{ message: { content: '  ' } }] }), /AI_EMPTY_RESPONSE/)
  assert.throws(() => extractChatText({}), /AI_EMPTY_RESPONSE/)
})

test('returns cors headers for browser calls', () => {
  assert.equal(corsHeaders()['Access-Control-Allow-Methods'], 'POST, OPTIONS')
})