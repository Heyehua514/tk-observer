import { describe, expect, it } from 'vitest'
import { rankAiMemories } from './ai-memory-ranking'

const memory = (
  memoryKey: string,
  confidence: number,
  lastUsedAt?: string
) => ({
  id: memoryKey,
  memoryType: 'accepted_ai',
  memoryKey,
  memoryValue: '建议',
  confidence,
  source: 'accepted_ai',
  lastUsedAt,
})

describe('rankAiMemories', () => {
  it('keeps current scope memories ahead of higher-confidence unrelated memories', () => {
    const ranked = rankAiMemories(
      [
        memory('其他工作台:分析', 0.99, '2026-08-24T12:00:00Z'),
        memory('商务工作台:分析', 0.4, '2026-08-20T12:00:00Z'),
      ],
      '商务工作台',
      '分析'
    )

    expect(ranked.map((item) => item.memoryKey)).toEqual([
      '商务工作台:分析',
      '其他工作台:分析',
    ])
  })

  it('orders matching scope memories by confidence then latest usage', () => {
    const ranked = rankAiMemories(
      [
        memory('商务工作台:文案', 0.6, '2026-08-24T08:00:00Z'),
        memory('商务工作台:分析', 0.8, '2026-08-20T08:00:00Z'),
        memory('商务工作台:调研', 0.8, '2026-08-24T09:00:00Z'),
      ],
      '商务工作台',
      '分析'
    )

    expect(ranked.map((item) => item.memoryKey)).toEqual([
      '商务工作台:调研',
      '商务工作台:分析',
      '商务工作台:文案',
    ])
  })

  it('limits eligible memories to eight records', () => {
    const ranked = rankAiMemories(
      Array.from({ length: 10 }, (_, index) =>
        memory(
          `商务工作台:${index}`,
          0.5,
          `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00Z`
        )
      ),
      '商务工作台',
      '分析'
    )

    expect(ranked).toHaveLength(8)
  })
})
