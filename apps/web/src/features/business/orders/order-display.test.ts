/** 商务渠道商单展示模型自检；避免组件内重复写枚举和金额格式。 */
import { describe, expect, it } from 'vitest'
import {
  buildOrderDisplay,
  orderContentTypeLabel,
  orderPlatformLabel,
  orderPublishDateLabel,
  orderStatusLabel,
} from './order-display'

describe('business order display model', () => {
  it('maps known enum values into stable Chinese labels', () => {
    expect(orderStatusLabel('confirmed')).toBe('已确认')
    expect(orderPlatformLabel('tiktok')).toBe('TikTok')
    expect(orderContentTypeLabel('unboxing')).toBe('开箱测评')
  })

  it('keeps unknown enum values visible instead of hiding data', () => {
    expect(orderStatusLabel('custom_stage')).toBe('custom_stage')
    expect(orderPlatformLabel('custom_platform')).toBe('custom_platform')
    expect(orderContentTypeLabel('custom_type')).toBe('custom_type')
  })

  it('formats money and publish date for table rows', () => {
    expect(
      buildOrderDisplay({
        amount: 128000,
        status: 'published',
        platform: 'youtube',
        contentType: 'live_commerce',
        publishDate: '2026-08-12 10:00:00.000Z',
      })
    ).toEqual({
      amount: '¥1,280.00',
      status: '已发布',
      platform: 'YouTube',
      contentType: '直播带货',
      publishDate: '2026-08-12',
    })
    expect(orderPublishDateLabel('')).toBe('—')
  })
})
