import { describe, expect, it } from 'vitest'
import { mapSupabaseCompanySearch } from './global-search-supabase-mapper'

describe('global search client source contract', () => {
  it('maps clients rows without requiring the legacy companies schema', () => {
    expect(mapSupabaseCompanySearch({ id: 'client-1', name: '测试客户', company: '测试公司' })).toMatchObject({
      kind: 'company',
      label: '测试客户',
    })
  })
})
