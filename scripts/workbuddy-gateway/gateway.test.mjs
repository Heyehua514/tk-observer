import { test } from 'node:test'
import assert from 'node:assert'
import { extractAssistantText } from './server.mjs'

test('extractAssistantText 取最后一段 assistant 文本', () => {
  const result = [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] },
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: '```json\n{"ok":true}\n```' }],
    },
  ]
  assert.equal(extractAssistantText(result), '```json\n{"ok":true}\n```')
})

test('无 assistant 输出时回退整个结果 JSON', () => {
  const result = [{ type: 'message', role: 'user', content: [] }]
  assert.equal(extractAssistantText(result), JSON.stringify(result))
})
