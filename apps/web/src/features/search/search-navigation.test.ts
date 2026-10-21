import { describe, expect, it } from 'vitest'
import { buildWorkbenchNavigation } from './search-navigation'

describe('buildWorkbenchNavigation', () => {
  it('maps creator searches to business workbench creators tab with filter query', () => {
    const route = buildWorkbenchNavigation('creator', '跨境美妆')
    expect(route.to).toBe('/business')
    expect(route.search).toMatchObject({
      tab: 'creators',
      query: '跨境美妆',
      companyQuery: '',
      page: 1,
    })
    expect(route.label).toContain('跨境美妆')
  })

  it('maps creator item focus with recordType and recordId', () => {
    const route = buildWorkbenchNavigation('creator', '美妆', { id: 'c-101' })
    expect(route.to).toBe('/business')
    expect(route.search).toMatchObject({
      tab: 'creators',
      query: '美妆',
      recordType: 'creator',
      recordId: 'c-101',
    })
  })

  it('maps company searches to business workbench companies tab with companyQuery', () => {
    const route = buildWorkbenchNavigation('company', '品牌供应商')
    expect(route.to).toBe('/business')
    expect(route.search).toMatchObject({
      tab: 'companies',
      companyQuery: '品牌供应商',
      query: '',
    })
    expect(route.label).toContain('品牌供应商')
  })

  it('maps product searches to market workbench with query', () => {
    const route = buildWorkbenchNavigation('product', '无线蓝牙耳机', {
      id: 'p-88',
    })
    expect(route.to).toBe('/market')
    expect(route.search).toMatchObject({
      query: '无线蓝牙耳机',
      recordType: 'product',
      recordId: 'p-88',
    })
  })

  it('maps account searches to editing competitor workbench with query', () => {
    const route = buildWorkbenchNavigation('account', 'AnkerOfficial')
    expect(route.to).toBe('/editing')
    expect(route.search).toMatchObject({
      section: 'competitors',
      tab: 'list',
      query: 'AnkerOfficial',
    })
  })

  it('maps video searches to editing production workbench with query', () => {
    const route = buildWorkbenchNavigation('video', '爆款带货视频', {
      id: 'v-99',
    })
    expect(route.to).toBe('/editing')
    expect(route.search).toMatchObject({
      section: 'production',
      tab: 'list',
      query: '爆款带货视频',
      recordType: 'video',
      recordId: 'v-99',
    })
  })

  it('maps knowledge and ai_memory to overview', () => {
    const route = buildWorkbenchNavigation('knowledge', '', { id: 'k-1' })
    expect(route.to).toBe('/overview')
    expect(route.search).toMatchObject({
      recordType: 'knowledge',
      recordId: 'k-1',
    })
  })
})
