import { describe, expect, it } from 'vitest'
import { mapVideoMetricsLog, serializeVideoMetricsLog } from './video-metrics-mapper'

describe('video-metrics-mapper', () => {
  it('maps Supabase row to VideoMetricsLog entity with fallbacks', () => {
    const raw = {
      id: 'log-123',
      video_id: 'vid-456',
      views: 12500,
      likes: 680,
      comments: 42,
      shares: 19,
      completion_rate: 18.5,
      conversion_gmv_cents: 99000,
      order_count: 15,
      logged_at: '2026-10-11T12:00:00Z',
      operator_name: '谢洁',
      notes: '首发表现亮眼',
    }
    const mapped = mapVideoMetricsLog(raw)
    expect(mapped.id).toBe('log-123')
    expect(mapped.videoId).toBe('vid-456')
    expect(mapped.views).toBe(12500)
    expect(mapped.likes).toBe(680)
    expect(mapped.comments).toBe(42)
    expect(mapped.shares).toBe(19)
    expect(mapped.completionRate).toBe(18.5)
    expect(mapped.conversionGmvCents).toBe(99000)
    expect(mapped.orderCount).toBe(15)
    expect(mapped.operatorName).toBe('谢洁')
    expect(mapped.notes).toBe('首发表现亮眼')
  })

  it('serializes input for Supabase insertion with safety constraints', () => {
    const serialized = serializeVideoMetricsLog({
      videoId: 'vid-123',
      views: 500,
      likes: 20,
      comments: 5,
      shares: 2,
      completionRate: 12.34,
      conversionGmvCents: 15000,
      orderCount: 3,
      operatorName: '谢洁',
      notes: '测试打卡',
    })
    expect(serialized.video_id).toBe('vid-123')
    expect(serialized.views).toBe(500)
    expect(serialized.shares).toBe(2)
    expect(serialized.completion_rate).toBe(12.34)
    expect(serialized.conversion_gmv_cents).toBe(15000)
    expect(serialized.order_count).toBe(3)
    expect(serialized.operator_name).toBe('谢洁')
    expect(serialized.notes).toBe('测试打卡')
  })
})
