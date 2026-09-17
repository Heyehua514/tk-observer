import { describe, expect, it } from 'vitest'
import { selectOverviewDigestItems } from './overview-intelligence-model'
import type { IntelligenceItem } from '@/features/intelligence/intelligence-model'

describe('selectOverviewDigestItems', () => {
  it('filters out ignored items and limits results', () => {
    const mockItems: IntelligenceItem[] = [
      { id: '1', title: 'Item 1', status: 'unread' } as any,
      { id: '2', title: 'Item 2', status: 'ignored' } as any,
      { id: '3', title: 'Item 3', status: 'assigned' } as any,
      { id: '4', title: 'Item 4', status: 'unread' } as any,
      { id: '5', title: 'Item 5', status: 'unread' } as any,
      { id: '6', title: 'Item 6', status: 'unread' } as any,
    ]

    const result = selectOverviewDigestItems(mockItems, 3)
    expect(result.map((i) => i.id)).toEqual(['1', '3', '4'])
  })
})
