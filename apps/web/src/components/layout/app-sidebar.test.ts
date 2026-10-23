import { describe, expect, it } from 'vitest'
import { canSeeNavigationItem } from './app-sidebar-model'

describe('app sidebar navigation visibility', () => {
  it('shows the shared intelligence center to every authenticated role', () => {
    const item = { to: '/intelligence' as const }

    expect(canSeeNavigationItem('boss', item)).toBe(true)
    expect(canSeeNavigationItem('business', item)).toBe(true)
    expect(canSeeNavigationItem('market', item)).toBe(true)
    expect(canSeeNavigationItem('design', item)).toBe(true)
    expect(canSeeNavigationItem('editing', item)).toBe(true)
  })

  it('keeps role-specific workbenches restricted', () => {
    expect(canSeeNavigationItem('market', { to: '/business' })).toBe(false)
    expect(canSeeNavigationItem('boss', { to: '/business' })).toBe(true)
    expect(canSeeNavigationItem('business', { to: '/design' })).toBe(true)
  })
})
