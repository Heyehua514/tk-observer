/** 商务达人详情关联视频 Supabase/PocketBase 双源映射自检。 */
import { describe, expect, it } from 'vitest'
import { mapCreatorVideoRecord } from './use-creator-videos'

describe('mapCreatorVideoRecord', () => {
  it('maps Supabase videos into creator detail summaries', () => {
    expect(
      mapCreatorVideoRecord({
        id: 'video-1',
        title: '达人测评视频',
        product_name: '蓝牙音箱',
        region: 'US',
        publish_at: null,
        updated_at: '2026-08-13T10:00:00Z',
      })
    ).toEqual({
      id: 'video-1',
      title: '达人测评视频',
      productName: '蓝牙音箱',
      region: 'US',
      publishAt: '',
      updated: '2026-08-13T10:00:00Z',
    })
  })
})
