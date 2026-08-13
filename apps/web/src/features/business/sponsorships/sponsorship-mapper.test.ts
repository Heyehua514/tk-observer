/** 商务活动招商 Supabase 映射测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { mapSponsorshipRecord } from './sponsorship-mapper'

describe('mapSponsorshipRecord', () => {
  it('maps joined Supabase rows into the business sponsorship panel model', () => {
    expect(
      mapSponsorshipRecord({
        id: 'sponsor-1',
        amount: 300000,
        stage: 'negotiating',
        contact_name: '董雨辰',
        events: { name: '金鳞会·厦门闭门沙龙' },
        clients: { name: '出海品牌客户' },
      })
    ).toEqual({
      id: 'sponsor-1',
      eventName: '金鳞会·厦门闭门沙龙',
      company: '出海品牌客户',
      amount: 300000,
      stage: 'negotiating',
      contact: '董雨辰',
    })
  })
})
