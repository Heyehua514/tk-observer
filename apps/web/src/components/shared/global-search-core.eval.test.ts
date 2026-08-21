import { describe, expect, it } from 'vitest'
import { mapSupabaseCompanySearch } from './global-search-supabase-mapper'

describe('global search client eval', () => {
  it('keeps the business client name visible when name and company differ', () => {
    expect(mapSupabaseCompanySearch({ id: 'client-1', name: '杨振康客户', company: '远海品牌' }).label).toBe('杨振康客户')
  })
})
