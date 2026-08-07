import { describe, expect, it } from 'vitest'
import { matchVenues } from './match-venues'
import type { Venue } from './types'

const venue: Venue = {
  id: '1',
  name: '海景会所',
  type: 'club',
  city: '厦门',
  address: '',
  capacityMin: 20,
  capacityMax: 80,
  priceRange: '',
  sceneTags: '私密,海景',
  pros: '',
  cons: '',
  contactName: '',
  contactPhone: '',
  siteVisitDate: '',
  siteVisitNotes: '',
  photos: [],
  isVerified: true,
  usageCount: 0,
  created: '',
  updated: '',
}
describe('matchVenues', () => {
  it('按城市、类型、容量和标签匹配', () =>
    expect(
      matchVenues([venue], {
        query: '海景',
        city: '厦门',
        type: 'club',
        attendees: 60,
      })
    ).toEqual([venue]))
  it('排除容量不足或人数低于最小值的场地', () => {
    expect(
      matchVenues([venue], { query: '', city: '', type: 'all', attendees: 100 })
    ).toEqual([])
    expect(
      matchVenues([venue], { query: '', city: '', type: 'all', attendees: 10 })
    ).toEqual([])
  })
})
