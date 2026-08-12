import { describe, expect, it } from 'vitest'
import { orderCreatePayload } from './order-create'

describe('orderCreatePayload', () => {
  it('serializes a complete order draft into PocketBase fields', () => {
    expect(
      orderCreatePayload({
        title: ' 新品测评 ',
        client: 'client-1',
        creator: 'creator-1',
        amount: '10000',
        platform: 'youtube',
        contentType: 'unboxing',
        publishDate: '2026-08-12',
      })
    ).toEqual({
      title: '新品测评',
      client: 'client-1',
      creator: 'creator-1',
      amount: 1_000_000,
      platform: 'youtube',
      content_type: 'unboxing',
      publish_date: '2026-08-12 00:00:00.000Z',
      status: 'negotiating',
    })
  })

  it('rejects incomplete or invalid amount drafts', () => {
    expect(
      orderCreatePayload({
        title: '',
        client: 'client-1',
        creator: 'creator-1',
        amount: '100',
        platform: 'tiktok',
        contentType: 'other',
        publishDate: '',
      })
    ).toBeNull()
    expect(
      orderCreatePayload({
        title: '测试',
        client: 'client-1',
        creator: 'creator-1',
        amount: '1.999',
        platform: 'tiktok',
        contentType: 'other',
        publishDate: '',
      })
    ).toBeNull()
  })
})
