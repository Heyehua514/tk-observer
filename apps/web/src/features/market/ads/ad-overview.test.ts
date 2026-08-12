import { describe, expect, it } from 'vitest'
import { buildAdOverview } from './ad-overview'

describe('buildAdOverview', () => {
  it('returns stable region chart data and headline summary', () => {
    expect(buildAdOverview()).toEqual({
      regions: [
        { region: 'US', value: 18 },
        { region: 'UK', value: 12 },
        { region: 'TH', value: 9 },
        { region: 'ID', value: 15 },
      ],
      summary: [
        { label: '本月投放', value: '8 条', delta: '+2' },
        { label: '高转化素材', value: '3 条', delta: '+1' },
        { label: '有效站点', value: '4 个', delta: '+1' },
      ],
    })
  })
})
