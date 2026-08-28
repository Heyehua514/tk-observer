import { describe, expect, it } from 'vitest'
import { parseTopicBlocks } from './trending-utils'

describe('parseTopicBlocks', () => {
  it('marks pasted research as manually captured with source and collection date', () => {
    const [topic] = parseTopicBlocks('话题：跨境内容趋势\n来源：人工调研')
    expect(topic.source).toBe('人工调研')
    expect(topic.discoveredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
  })
})
