import { describe, expect, it } from 'vitest'
import { getAiProfile } from './ai-profile'

describe('AI role profiles', () => {
  it('returns a role-specific assistant name and focus', () => {
    expect(getAiProfile('business')).toMatchObject({
      assistantName: '商务助手',
      focus: expect.arrayContaining(['客户跟进', '商机推进']),
    })
  })

  it('falls back to a general assistant for unknown roles', () => {
    expect(getAiProfile('unknown')).toMatchObject({ assistantName: '工作助手' })
  })
})
